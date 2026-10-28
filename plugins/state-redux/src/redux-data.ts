import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { StoreSnapshot } from "@next-devtools/core";

export interface ReduxData {
  readonly adapters: readonly {
    id: string;
    label: string;
    canMutate: boolean;
  }[];
  readonly hasGlobalStore: boolean;
  readonly hasStores: boolean;
}

export function buildReduxData(
  snapshot: RuntimeServiceSnapshot<StoreSnapshot> | null | undefined,
  hasGlobalStore: boolean,
): ReduxData {
  const adapters = (snapshot?.data?.adapters ?? [])
    .filter(
      (a) =>
        a.id.toLowerCase().includes("redux") ||
        a.label.toLowerCase().includes("redux"),
    )
    .map((a) => ({ id: a.id, label: a.label, canMutate: a.canMutate }));
  return {
    adapters,
    hasGlobalStore,
    hasStores: adapters.length > 0 || hasGlobalStore,
  };
}
