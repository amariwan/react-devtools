// Snapshot and cursor protocol for paged, abortable reads.

export type Cursor = string & { readonly __brand: "Cursor" };

export function makeCursor(value: string): Cursor {
  return value as Cursor;
}

export type SnapshotMeta = {
  source: string; // which port/adapter
  capturedAtUnixMs: number;
  stale: boolean;
  partial: boolean;
  sequence: number;
};

export type PagedSnapshot<T> = {
  meta: SnapshotMeta;
  items: T[];
  nextCursor: Cursor | null;
  totalCount?: number;
};

export type ReadRequest = {
  cursor?: Cursor;
  limit?: number;
  filter?: Record<string, unknown>;
  signal?: AbortSignal;
};

export type ReadResult<T> = PagedSnapshot<T>;

export type Handle = string & { readonly __brand: "Handle" };

export function makeHandle(value: string): Handle {
  return value as Handle;
}
