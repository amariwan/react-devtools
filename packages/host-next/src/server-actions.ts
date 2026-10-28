// Opt-in server actions / cache / proxy instrumentation helpers.
// Payload/response are OFF by default; only metadata is recorded.

export type ServerOperationKind = "action" | "cache" | "proxy";

export type ServerActionMeta = {
  kind: ServerOperationKind;
  name: string;
  route?: string;
  durationMs?: number;
  status: "ok" | "error";
  timestampUnixMs: number;
};

export function wrapServerAction<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  onMeta?: (meta: ServerActionMeta) => void,
): (...args: TArgs) => Promise<TResult> {
  return wrapServerOperation("action", name, fn, onMeta);
}

export function wrapCacheOperation<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  onMeta?: (meta: ServerActionMeta) => void,
): (...args: TArgs) => Promise<TResult> {
  return wrapServerOperation("cache", name, fn, onMeta);
}

export function wrapProxyOperation<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  onMeta?: (meta: ServerActionMeta) => void,
): (...args: TArgs) => Promise<TResult> {
  return wrapServerOperation("proxy", name, fn, onMeta);
}

function wrapServerOperation<TArgs extends unknown[], TResult>(
  kind: ServerOperationKind,
  name: string,
  fn: (...args: TArgs) => Promise<TResult>,
  onMeta?: (meta: ServerActionMeta) => void,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      onMeta?.({
        kind,
        name,
        durationMs: Date.now() - start,
        status: "ok",
        timestampUnixMs: Date.now(),
      });
      return result;
    } catch (err) {
      onMeta?.({
        kind,
        name,
        durationMs: Date.now() - start,
        status: "error",
        timestampUnixMs: Date.now(),
      });
      throw err;
    }
  };
}
