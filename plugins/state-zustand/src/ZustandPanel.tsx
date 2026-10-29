import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import {
  Badge,
  EmptyState,
  PanelHeader,
  StoreInspector,
} from "@next-devtools/ui";
import { buildZustandData } from "./zustand-data.js";

export default function ZustandPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const service = registry.services.get<StoreAdapterRegistry>(
    RUNTIME_SERVICE_IDS.stores,
  );
  const subscribe = React.useMemo(
    () =>
      (listener: () => void): (() => void) =>
        service?.subscribe(listener) ?? (() => undefined),
    [service],
  );
  const getSnapshot = React.useMemo(
    () => () => service?.getSnapshot() ?? null,
    [service],
  );
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const globalStores = React.useMemo(() => {
    if (typeof window === "undefined") return [] as unknown[];
    const g = (window as unknown as { __ZUSTAND_STORES__?: unknown[] })
      .__ZUSTAND_STORES__;
    return Array.isArray(g) ? g : [];
  }, []);

  const data = React.useMemo(
    () => buildZustandData(snapshot, globalStores),
    [snapshot, globalStores],
  );

  return (
    <div className="devtools:flex devtools:min-h-0 devtools:flex-col">
      <PanelHeader
        title="Zustand"
        description="Inspect registered store snapshots."
        actions={
          <Badge variant="secondary">{data.adapters.length} adapters</Badge>
        }
      />
      {!data.hasStores ? (
        <EmptyState
          title="No Zustand adapter connected"
          description="Register a store adapter in your application to inspect live state."
        />
      ) : (
        <div className="devtools:p-3 devtools:space-y-3">
          <StoreInspector
            adapters={data.adapters}
            selectedAdapterId={snapshot?.data.selectedAdapterId}
            status={snapshot?.status}
            loading={snapshot?.data.loading}
            reason={snapshot?.reason}
            value={snapshot?.data.value}
            onSelect={async (id) => {
              await service?.select(id);
            }}
            onRefresh={async () => {
              await service?.refresh();
            }}
          />
          {data.globalCount > 0 ? (
            <p className="devtools:text-xs devtools:text-muted-foreground">
              Global stores detected. Register adapters to inspect their state.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
