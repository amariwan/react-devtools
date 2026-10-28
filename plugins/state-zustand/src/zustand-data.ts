import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { StoreSnapshot } from "@next-devtools/core";

export interface ZustandStoreRow {
  readonly id: string;
  readonly label: string;
  readonly canMutate: boolean;
}

export interface ZustandData {
  readonly adapters: readonly ZustandStoreRow[];
  readonly globalCount: number;
  readonly hasStores: boolean;
}

export function buildZustandData(
  snapshot: RuntimeServiceSnapshot<StoreSnapshot> | null | undefined,
  globalStores: readonly unknown[] = [],
): ZustandData {
  const adapters = (snapshot?.data?.adapters ?? [])
    .filter(
      (a) =>
        a.id.toLowerCase().includes("zustand") ||
        a.label.toLowerCase().includes("zustand"),
    )
    .map((a) => ({ id: a.id, label: a.label, canMutate: a.canMutate }));
  return {
    adapters,
    globalCount: globalStores.length,
    hasStores: adapters.length > 0 || globalStores.length > 0,
  };
}
