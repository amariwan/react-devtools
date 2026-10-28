import type { StoreAdapter } from "@next-devtools/core";

export interface ZustandStoreLike {
  getState?: () => unknown;
  subscribe?: (listener: () => void) => (() => void) | void;
}

export interface ZustandStoreEntry extends ZustandStoreLike {
  id?: string;
  label?: string;
}

export function createZustandAdapter(
  entry: ZustandStoreEntry,
  index: number,
): StoreAdapter | undefined {
  if (
    typeof entry.getState !== "function" ||
    typeof entry.subscribe !== "function"
  ) {
    return undefined;
  }
  return {
    id: `zustand:${entry.id ?? index}`,
    label: entry.label ?? entry.id ?? `Zustand store ${index + 1}`,
    read: () => entry.getState!(),
    subscribe: (listener) => {
      const unsubscribe = entry.subscribe!(listener);
      return typeof unsubscribe === "function" ? unsubscribe : () => undefined;
    },
  };
}
