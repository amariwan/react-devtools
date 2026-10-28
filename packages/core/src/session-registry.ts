import type {
  RuntimeService,
  RuntimeServiceSnapshot,
} from "@next-devtools/contracts";

export type SessionRecord = {
  sessionId: string;
  pageId?: string;
  url?: string;
  title?: string;
  connectedAtUnixMs: number;
  lastSeenUnixMs: number;
  stale: boolean;
};

export interface SessionRuntimeSnapshot {
  readonly sessions: readonly Readonly<SessionRecord>[];
  readonly activeSessionId?: string;
}

export interface SessionRegistry extends RuntimeService<SessionRuntimeSnapshot> {
  register(session: SessionRecord): void;
  update(sessionId: string, patch: Partial<SessionRecord>): void;
  touch(sessionId: string, nowUnixMs: number): void;
  markStale(sessionId: string): void;
  pruneStale(nowUnixMs: number): string[];
  remove(sessionId: string): void;
  get(sessionId: string): SessionRecord | undefined;
  list(): SessionRecord[];
  active(): SessionRecord | undefined;
  setActive(sessionId: string): void;
  dispose(): void;
}

export function createSessionRegistry(options?: {
  staleAfterMs?: number;
}): SessionRegistry {
  const staleAfterMs = options?.staleAfterMs ?? 30_000;
  const sessions = new Map<string, SessionRecord>();
  const listeners = new Set<() => void>();
  let activeId: string | undefined;
  let revision = 0;
  let disposed = false;
  let snapshot: RuntimeServiceSnapshot<SessionRuntimeSnapshot> =
    buildSnapshot();

  function orderedSessions(): SessionRecord[] {
    return Array.from(sessions.values()).sort(
      (left, right) =>
        left.connectedAtUnixMs - right.connectedAtUnixMs ||
        left.sessionId.localeCompare(right.sessionId),
    );
  }

  function buildSnapshot(): RuntimeServiceSnapshot<SessionRuntimeSnapshot> {
    return {
      status: disposed ? "unavailable" : "available",
      data: {
        sessions: orderedSessions().map((session) => ({ ...session })),
        ...(activeId ? { activeSessionId: activeId } : {}),
      },
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  function selectFallback() {
    activeId = orderedSessions().find((session) => !session.stale)?.sessionId;
  }

  const registry: SessionRegistry = {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    register(session) {
      if (disposed) return;
      sessions.set(session.sessionId, { ...session });
      if (!activeId && !session.stale) activeId = session.sessionId;
      notify();
    },
    update(sessionId, patch) {
      if (disposed) return;
      const current = sessions.get(sessionId);
      if (!current) return;
      sessions.set(sessionId, { ...current, ...patch, sessionId });
      notify();
    },
    touch(sessionId, nowUnixMs) {
      if (disposed) return;
      const current = sessions.get(sessionId);
      if (!current) return;
      sessions.set(sessionId, {
        ...current,
        lastSeenUnixMs: nowUnixMs,
        stale: false,
      });
      if (!activeId) activeId = sessionId;
      notify();
    },
    markStale(sessionId) {
      if (disposed) return;
      const current = sessions.get(sessionId);
      if (!current || current.stale) return;
      sessions.set(sessionId, { ...current, stale: true });
      notify();
    },
    pruneStale(nowUnixMs) {
      if (disposed) return [];
      const removed: string[] = [];
      for (const session of orderedSessions()) {
        if (!session.stale && nowUnixMs - session.lastSeenUnixMs < staleAfterMs)
          continue;
        sessions.delete(session.sessionId);
        removed.push(session.sessionId);
      }
      if (removed.length === 0) return removed;
      if (!activeId || removed.includes(activeId)) selectFallback();
      notify();
      return removed;
    },
    remove(sessionId) {
      if (disposed) return;
      if (!sessions.delete(sessionId)) return;
      if (activeId === sessionId) selectFallback();
      notify();
    },
    get(sessionId) {
      return sessions.get(sessionId);
    },
    list() {
      return orderedSessions();
    },
    active() {
      return activeId ? sessions.get(activeId) : undefined;
    },
    setActive(sessionId) {
      if (disposed) return;
      if (!sessions.has(sessionId) || activeId === sessionId) return;
      activeId = sessionId;
      notify();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sessions.clear();
      activeId = undefined;
      revision++;
      snapshot = buildSnapshot();
      listeners.clear();
    },
  };

  return registry;
}
