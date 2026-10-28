// Timeline event store (ring buffer) for the EventTimelinePort.

export type TimelineEvent = {
  id: string;
  layer: string;
  type: string;
  timestampUnixMs: number;
  monotonicMs?: number;
  payload: unknown;
  sessionId?: string;
  pageId?: string;
};

export type TimelineFilter = {
  layers?: string[];
  types?: string[];
  sinceUnixMs?: number;
  untilUnixMs?: number;
};

export type TimelineStore = {
  emit(event: Omit<TimelineEvent, "id">): TimelineEvent;
  list(
    filter?: TimelineFilter,
    cursor?: string,
    limit?: number,
  ): { items: TimelineEvent[]; nextCursor: string | null; dropped: number };
  clear(): void;
  size(): number;
  droppedCount(): number;
};

export function createTimelineStore(capacity = 5000): TimelineStore {
  const buffer: TimelineEvent[] = [];
  let dropped = 0;
  let seq = 0;

  function matches(e: TimelineEvent, f?: TimelineFilter): boolean {
    if (!f) return true;
    if (f.layers && f.layers.length && !f.layers.includes(e.layer))
      return false;
    if (f.types && f.types.length && !f.types.includes(e.type)) return false;
    if (f.sinceUnixMs !== undefined && e.timestampUnixMs < f.sinceUnixMs)
      return false;
    if (f.untilUnixMs !== undefined && e.timestampUnixMs > f.untilUnixMs)
      return false;
    return true;
  }

  return {
    emit(input) {
      const ev: TimelineEvent = { id: `ev_${++seq}`, ...input };
      if (buffer.length >= capacity) {
        buffer.shift();
        dropped++;
      }
      buffer.push(ev);
      return ev;
    },
    list(filter, cursor, limit = 100) {
      const startIdx = cursor
        ? buffer.findIndex((e) => e.id === cursor) + 1
        : 0;
      const out: TimelineEvent[] = [];
      let i = startIdx >= 0 ? startIdx : 0;
      while (i < buffer.length && out.length < limit) {
        const e = buffer[i]!;
        if (matches(e, filter)) out.push(e);
        i++;
      }
      const nextCursor =
        i < buffer.length && out.length === limit
          ? (out[out.length - 1]?.id ?? null)
          : null;
      return { items: out, nextCursor, dropped };
    },
    clear() {
      buffer.length = 0;
    },
    size() {
      return buffer.length;
    },
    droppedCount() {
      return dropped;
    },
  };
}
