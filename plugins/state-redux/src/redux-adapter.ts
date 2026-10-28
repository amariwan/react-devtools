import type { StoreAdapter } from "@next-devtools/core";

export interface ReduxStoreLike {
  getState?: () => unknown;
  subscribe?: (listener: () => void) => (() => void) | void;
}

export function createReduxAdapter(
  store: ReduxStoreLike,
  id = "default",
): StoreAdapter | undefined {
  if (
    typeof store.getState !== "function" ||
    typeof store.subscribe !== "function"
  ) {
    return undefined;
  }
  return {
    id: `redux:${id}`,
    label: `Redux store${id === "default" ? "" : ` · ${id}`}`,
    read: () => store.getState!(),
    subscribe: (listener) => {
      const unsubscribe = store.subscribe!(listener);
      return typeof unsubscribe === "function" ? unsubscribe : () => undefined;
    },
  };
}
