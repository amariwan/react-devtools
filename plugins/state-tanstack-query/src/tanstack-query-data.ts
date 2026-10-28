import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { StoreSnapshot } from "@next-devtools/core";

export interface TanStackQueryData {
  readonly adapters: readonly {
    id: string;
    label: string;
    canMutate: boolean;
  }[];
  readonly globalDetected: boolean;
  readonly hasData: boolean;
}

export function buildTanStackQueryData(
  snapshot: RuntimeServiceSnapshot<StoreSnapshot> | null | undefined,
  globalDetected: boolean,
): TanStackQueryData {
  const adapters = (snapshot?.data?.adapters ?? [])
    .filter(
      (a) =>
        a.id.toLowerCase().includes("tanstack") ||
        a.id.toLowerCase().includes("react-query") ||
        a.id.toLowerCase().includes("query") ||
        a.label.toLowerCase().includes("query"),
    )
    .map((a) => ({ id: a.id, label: a.label, canMutate: a.canMutate }));
  return {
    adapters,
    globalDetected,
    hasData: adapters.length > 0 || globalDetected,
  };
}
