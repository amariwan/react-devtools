import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import { EmptyState, StoreInspector } from "@next-devtools/ui";
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Zustand</h2>
      <div style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
        {data.adapters.length} registered adapters · {data.globalCount} global
        stores
      </div>
      {!data.hasStores ? (
        <EmptyState
          title="No Zustand stores detected"
          description="Register an adapter or expose window.__ZUSTAND_STORES__."
        />
      ) : (
        <>
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
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {data.adapters.map((a) => (
              <li
                key={a.id}
                style={{
                  fontSize: 12,
                  padding: "6px 8px",
                  border: "1px solid var(--border, #e4e4e7)",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span>{a.label}</span>
                <span style={{ color: "var(--muted, #71717a)" }}>
                  {a.canMutate ? "mutable" : "read-only"}
                </span>
              </li>
            ))}
            {data.globalCount > 0 ? (
              <li
                style={{
                  fontSize: 12,
                  padding: "6px 8px",
                  border: "1px dashed var(--border, #e4e4e7)",
                  borderRadius: 4,
                  color: "var(--muted, #71717a)",
                }}
              >
                {data.globalCount} global store(s) detected (not yet bridged).
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}
