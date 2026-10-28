import type { StoreAdapter } from "@next-devtools/core";

interface QueryLike {
  queryKey?: unknown;
  state?: {
    status?: unknown;
    fetchStatus?: unknown;
    data?: unknown;
    error?: unknown;
  };
}

export interface QueryClientLike {
  getQueryCache?: () => {
    getAll?: () => QueryLike[];
    subscribe?: (listener: () => void) => (() => void) | void;
  };
}

export function createQueryAdapter(
  client: QueryClientLike,
): StoreAdapter | undefined {
  const getCache = client.getQueryCache;
  if (typeof getCache !== "function") return undefined;
  const cache = getCache.call(client);
  if (
    typeof cache.getAll !== "function" ||
    typeof cache.subscribe !== "function"
  ) {
    return undefined;
  }
  return {
    id: "tanstack-query:default",
    label: "TanStack Query cache",
    read: () =>
      cache.getAll!().map((query) => ({
        queryKey: query.queryKey,
        status: query.state?.status,
        fetchStatus: query.state?.fetchStatus,
        data: query.state?.data,
        error: query.state?.error,
      })),
    subscribe: (listener) => {
      const unsubscribe = cache.subscribe!(listener);
      return typeof unsubscribe === "function" ? unsubscribe : () => undefined;
    },
  };
}
