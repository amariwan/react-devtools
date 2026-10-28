import type {
  RuntimeService,
  RuntimeServiceSnapshot,
  RuntimeServiceStatus,
} from "@next-devtools/contracts";
import { resolveSourceMapPosition } from "./source-map-runtime.js";

export type RuntimeDiagnosticKind = "error" | "unhandled-rejection";

export type RuntimeDiagnosticSourceFrame = {
  readonly source: string;
  readonly line: number;
  readonly column: number;
  readonly functionName?: string;
  readonly origin: "runtime-stack" | "source-map";
  readonly confidence: "approximate" | "exact";
};

export type RuntimeDiagnostic = {
  readonly id: string;
  readonly kind: RuntimeDiagnosticKind;
  readonly name?: string;
  readonly message: string;
  readonly stack?: string;
  readonly sourceFrame?: RuntimeDiagnosticSourceFrame;
  readonly route?: string;
  readonly timestampUnixMs: number;
};

export interface DiagnosticsRuntimeSnapshot {
  readonly events: readonly RuntimeDiagnostic[];
  readonly dropped: number;
}

export interface DiagnosticsRuntime extends RuntimeService<DiagnosticsRuntimeSnapshot> {
  record(input: {
    kind: RuntimeDiagnosticKind;
    error: unknown;
    route?: string;
    timestampUnixMs?: number;
  }): void;
  clear(): void;
  dispose(): void;
}

function boundedText(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

const SOURCE_MAP_CACHE = new Map<string, unknown>();
const MAX_SOURCE_MAP_CACHE = 16;
const SOURCE_MAP_TIMEOUT_MS = 2_000;

function isSameOriginSource(source: string): boolean {
  if (typeof location === "undefined") return false;
  try {
    return new URL(source, location.href).origin === location.origin;
  } catch {
    return false;
  }
}

async function fetchBoundedText(
  url: string,
  maxBytes: number,
): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_MAP_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      signal: controller.signal,
    });
    if (!response.ok) return undefined;
    const declaredLength = response.headers?.get?.("content-length");
    if (declaredLength && Number(declaredLength) > maxBytes) return undefined;

    if (!response.body) {
      const text = await response.text();
      return text.length <= maxBytes ? text : undefined;
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          return undefined;
        }
        chunks.push(next.value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSourceMap(source: string): Promise<unknown | undefined> {
  if (!isSameOriginSource(source) || typeof fetch !== "function")
    return undefined;
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(source, location.href);
  } catch {
    return undefined;
  }
  const sourceText = await fetchBoundedText(sourceUrl.toString(), 1_048_576);
  if (sourceText === undefined) return undefined;
  const directive = sourceText.match(/[#@]\s*sourceMappingURL=([^\s]+)/);
  const mapUrl = directive?.[1]
    ? new URL(directive[1], sourceUrl).toString()
    : `${sourceUrl}.map`;
  if (!isSameOriginSource(mapUrl)) return undefined;
  const cached = SOURCE_MAP_CACHE.get(mapUrl);
  if (cached) return cached;
  const mapText = await fetchBoundedText(mapUrl, 1_048_576);
  if (mapText === undefined) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(mapText);
  } catch {
    return undefined;
  }
  if (SOURCE_MAP_CACHE.size >= MAX_SOURCE_MAP_CACHE) {
    SOURCE_MAP_CACHE.delete(SOURCE_MAP_CACHE.keys().next().value as string);
  }
  SOURCE_MAP_CACHE.set(mapUrl, parsed);
  return parsed;
}

async function resolveMappedFrame(
  frame: RuntimeDiagnosticSourceFrame,
): Promise<RuntimeDiagnosticSourceFrame | undefined> {
  try {
    const map = await fetchSourceMap(frame.source);
    const mapped = resolveSourceMapPosition(
      map,
      frame.line,
      Math.max(0, frame.column - 1),
      frame.source,
    );
    if (!mapped) return undefined;
    return {
      ...frame,
      source: boundedText(mapped.source, 2048),
      line: mapped.line,
      column: mapped.column,
      origin: "source-map",
      confidence: "exact",
    };
  } catch {
    return undefined;
  }
}

function normalizeError(error: unknown): {
  name?: string;
  message: string;
  stack?: string;
  sourceFrame?: RuntimeDiagnosticSourceFrame;
} {
  if (error instanceof Error) {
    const stack = error.stack ? boundedText(error.stack, 8192) : undefined;
    return {
      ...(error.name ? { name: boundedText(error.name, 128) } : {}),
      message: boundedText(error.message || "Unknown error", 2048),
      ...(stack ? { stack } : {}),
      ...(stack ? parseRuntimeStackFrame(stack) : {}),
    };
  }
  return { message: boundedText(String(error), 2048) };
}

/**
 * Extracts evidence from common browser/Node stack formats without claiming a
 * source map. The returned frame is suitable for display and investigation,
 * not direct editor authorization.
 */
export function parseRuntimeStackFrame(
  stack: string,
): { sourceFrame: RuntimeDiagnosticSourceFrame } | undefined {
  for (const line of stack.split("\n")) {
    const trimmed = line.trim();
    const parenthesized = trimmed.match(/^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/);
    const bare = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
    const firefox = trimmed.match(/^(.*?)@(.+):(\d+):(\d+)$/);
    const functionName = parenthesized?.[1] ?? firefox?.[1];
    const source = parenthesized?.[2] ?? firefox?.[2] ?? bare?.[1];
    const lineNumber = parenthesized?.[3] ?? firefox?.[3] ?? bare?.[2];
    const columnNumber = parenthesized?.[4] ?? firefox?.[4] ?? bare?.[3];
    const lineValue = Number(lineNumber);
    const columnValue = Number(columnNumber);
    if (
      !source ||
      source.includes("eval at") ||
      source === "native code" ||
      !Number.isSafeInteger(lineValue) ||
      !Number.isSafeInteger(columnValue) ||
      lineValue < 1 ||
      columnValue < 1
    )
      continue;
    return {
      sourceFrame: {
        source: boundedText(source, 2048),
        line: lineValue,
        column: columnValue,
        ...(functionName?.trim()
          ? { functionName: boundedText(functionName.trim(), 256) }
          : {}),
        origin: "runtime-stack",
        confidence: "approximate",
      },
    };
  }
  return undefined;
}

export function createDiagnosticsRuntime(options?: {
  capacity?: number;
  now?: () => number;
}): DiagnosticsRuntime {
  const capacity = Math.max(1, options?.capacity ?? 200);
  const now = options?.now ?? Date.now;
  const events: RuntimeDiagnostic[] = [];
  const listeners = new Set<() => void>();
  let sequence = 0;
  let dropped = 0;
  let revision = 0;
  let status: RuntimeServiceStatus = "available";
  let disposed = false;
  let snapshot: RuntimeServiceSnapshot<DiagnosticsRuntimeSnapshot> =
    buildSnapshot();

  function buildSnapshot(): RuntimeServiceSnapshot<DiagnosticsRuntimeSnapshot> {
    return {
      status,
      data: { events: [...events], dropped },
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    record(input) {
      if (disposed) return;
      if (events.length >= capacity) {
        events.shift();
        dropped++;
      }
      const normalized = normalizeError(input.error);
      const id = `diag_${++sequence}`;
      events.push({
        id,
        kind: input.kind,
        ...normalized,
        ...(input.route ? { route: boundedText(input.route, 2048) } : {}),
        timestampUnixMs: input.timestampUnixMs ?? now(),
      });
      notify();
      const frame = normalized.sourceFrame;
      if (frame) {
        void resolveMappedFrame(frame).then((mapped) => {
          if (!mapped || disposed) return;
          const index = events.findIndex((candidate) => candidate.id === id);
          const event = index >= 0 ? events[index] : undefined;
          if (!event || event.sourceFrame !== frame) return;
          events[index] = { ...event, sourceFrame: mapped };
          notify();
        });
      }
    },
    clear() {
      if (disposed) return;
      events.length = 0;
      dropped = 0;
      notify();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      status = "unavailable";
      events.length = 0;
      listeners.clear();
      revision++;
      snapshot = buildSnapshot();
    },
  };
}
