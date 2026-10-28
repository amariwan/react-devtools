import type { DebugSession } from "@next-devtools/core";

export const DEBUG_SESSION_STORAGE_KEY = "next-devtools.debug-sessions.v1";
export const SHARED_DEBUG_SESSION_STORAGE_KEY =
  "next-devtools.debug-sessions.shared.v1";
export const DEBUG_SESSION_SHARING_KEY =
  "next-devtools.debug-sessions.share-across-tabs.v1";
const MAX_SESSIONS = 2;
const MAX_STORAGE_CHARS = 300_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDebugSession(value: unknown): value is DebugSession {
  if (!isRecord(value)) return false;
  const profiler = value.profiler;
  return (
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0 &&
    typeof value.capturedAtUnixMs === "number" &&
    Number.isFinite(value.capturedAtUnixMs) &&
    Array.isArray(value.timeline) &&
    Array.isArray(value.network) &&
    Array.isArray(value.diagnostics) &&
    isRecord(profiler) &&
    Array.isArray(profiler.commits) &&
    Array.isArray(profiler.ranked) &&
    typeof profiler.totalActualDuration === "number" &&
    typeof profiler.totalBaseDuration === "number" &&
    typeof profiler.maxActualDuration === "number"
  );
}

export function loadDebugSessions(
  storage?: Storage,
  key = DEBUG_SESSION_STORAGE_KEY,
): DebugSession[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDebugSession).slice(-MAX_SESSIONS);
  } catch {
    return [];
  }
}

export function saveDebugSessions(
  storage: Storage | undefined,
  sessions: readonly DebugSession[],
  key = DEBUG_SESSION_STORAGE_KEY,
): void {
  if (!storage) return;
  const bounded = sessions.slice(-MAX_SESSIONS);
  try {
    const raw = JSON.stringify(bounded);
    if (raw.length > MAX_STORAGE_CHARS) return;
    storage.setItem(key, raw);
  } catch {
    // Storage can be unavailable, quota-limited, or contain unserializable data.
  }
}
