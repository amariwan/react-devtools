import type {
  RuntimeService,
  RuntimeServiceSnapshot,
  RuntimeServiceStatus,
} from "@next-devtools/contracts";

export interface NetworkPerformanceEntry {
  readonly name: string;
  readonly initiatorType: string;
  /** Optional browser-exposed HTTP status (not available in every engine). */
  readonly responseStatus?: number;
  readonly startTime: number;
  readonly duration: number;
  readonly transferSize: number;
  readonly encodedBodySize: number;
  readonly decodedBodySize: number;
}

export interface PerformanceObserverHandle {
  observe(options: { type: "resource"; buffered: boolean }): void;
  disconnect(): void;
}

export type PerformanceObserverFactory = (
  listener: (entries: readonly NetworkPerformanceEntry[]) => void,
) => PerformanceObserverHandle;

export interface NetworkEntry {
  readonly id: string;
  readonly url: string;
  readonly initiatorType: string;
  readonly status?: number;
  readonly startTime: number;
  readonly duration: number;
  readonly transferSize: number;
  readonly encodedBodySize: number;
  readonly decodedBodySize: number;
  readonly capturedAtUnixMs: number;
}

export interface NetworkRuntimeSnapshot {
  readonly recording: boolean;
  readonly entries: readonly NetworkEntry[];
  readonly dropped: number;
}

export interface NetworkRuntimeService extends RuntimeService<NetworkRuntimeSnapshot> {
  start(): void;
  stop(): void;
  clear(): void;
  dispose(): void;
}

function browserObserverFactory(): PerformanceObserverFactory | undefined {
  if (typeof PerformanceObserver === "undefined") return undefined;
  return (listener) => {
    const observer = new PerformanceObserver((list) => {
      const entries = list
        .getEntries()
        .filter((entry) => entry.entryType === "resource")
        .map((entry) => {
          const resource = entry as PerformanceResourceTiming & {
            responseStatus?: number;
          };
          return {
            name: resource.name,
            initiatorType: resource.initiatorType,
            ...(typeof resource.responseStatus === "number" &&
            Number.isFinite(resource.responseStatus)
              ? { responseStatus: resource.responseStatus }
              : {}),
            startTime: resource.startTime,
            duration: resource.duration,
            transferSize: resource.transferSize,
            encodedBodySize: resource.encodedBodySize,
            decodedBodySize: resource.decodedBodySize,
          } satisfies NetworkPerformanceEntry;
        });
      listener(entries);
    });
    return observer;
  };
}

function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input, "http://localhost");
    url.username = "";
    url.password = "";
    for (const key of new Set(url.searchParams.keys())) {
      url.searchParams.set(key, "[redacted]");
    }
    url.hash = "";
    return url.toString();
  } catch {
    return "[invalid-url]";
  }
}

export function createNetworkRuntimeService(options?: {
  capacity?: number;
  performanceObserverFactory?: PerformanceObserverFactory | null;
  now?: () => number;
}): NetworkRuntimeService {
  const capacity = Math.max(1, options?.capacity ?? 1000);
  const factory =
    options && "performanceObserverFactory" in options
      ? (options.performanceObserverFactory ?? undefined)
      : browserObserverFactory();
  const now = options?.now ?? Date.now;
  const listeners = new Set<() => void>();
  const entries: NetworkEntry[] = [];
  let observer: PerformanceObserverHandle | undefined;
  let recording = false;
  let dropped = 0;
  let sequence = 0;
  let revision = 0;
  let status: RuntimeServiceStatus = factory ? "available" : "unavailable";
  let reason: string | undefined = factory
    ? undefined
    : "PerformanceObserver resource timing is unavailable";
  let snapshot: RuntimeServiceSnapshot<NetworkRuntimeSnapshot> =
    buildSnapshot();
  let disposed = false;

  function buildSnapshot(): RuntimeServiceSnapshot<NetworkRuntimeSnapshot> {
    return {
      status,
      data: { recording, entries: [...entries], dropped },
      ...(reason ? { reason } : {}),
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  function capture(performanceEntries: readonly NetworkPerformanceEntry[]) {
    if (!recording) return;
    for (const entry of performanceEntries) {
      if (entries.length >= capacity) {
        entries.shift();
        dropped++;
      }
      entries.push({
        id: `net_${++sequence}`,
        url: sanitizeUrl(entry.name),
        initiatorType: entry.initiatorType,
        ...(typeof entry.responseStatus === "number" &&
        Number.isFinite(entry.responseStatus)
          ? { status: entry.responseStatus }
          : {}),
        startTime: entry.startTime,
        duration: entry.duration,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        capturedAtUnixMs: now(),
      });
    }
    if (performanceEntries.length > 0) notify();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      if (recording || !factory || disposed) return;
      try {
        observer = factory(capture);
        observer.observe({ type: "resource", buffered: true });
        recording = true;
        status = "available";
        reason = undefined;
        notify();
      } catch (error) {
        try {
          observer?.disconnect();
        } catch {
          /* isolate observer cleanup */
        }
        observer = undefined;
        recording = false;
        status = "error";
        reason = error instanceof Error ? error.message : String(error);
        notify();
      }
    },
    stop() {
      if (!recording) return;
      recording = false;
      const current = observer;
      observer = undefined;
      try {
        current?.disconnect();
      } catch {
        /* isolate observer cleanup */
      }
      notify();
    },
    clear() {
      if (disposed) return;
      entries.length = 0;
      dropped = 0;
      notify();
    },
    dispose() {
      if (disposed) return;
      if (recording) {
        recording = false;
        const current = observer;
        observer = undefined;
        try {
          current?.disconnect();
        } catch {
          /* isolate observer cleanup */
        }
      }
      disposed = true;
      status = "unavailable";
      reason = "Network runtime disposed";
      revision++;
      snapshot = buildSnapshot();
      listeners.clear();
    },
  };
}
