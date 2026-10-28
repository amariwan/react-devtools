import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import { EmptyState, StoreInspector } from "@next-devtools/ui";
import { buildReduxData } from "./redux-data.js";

export default function ReduxPanel({ registry }: { registry: PluginRegistry }) {
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

  const hasGlobalStore = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as unknown as { __REDUX_STORE__?: unknown }).__REDUX_STORE__,
    );
  }, []);

  const data = React.useMemo(
    () => buildReduxData(snapshot, hasGlobalStore),
    [snapshot, hasGlobalStore],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Redux</h2>
      <div style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
        {data.adapters.length} registered adapters
        {data.hasGlobalStore ? " · global store detected" : ""}
      </div>
      {!data.hasStores ? (
        <EmptyState
          title="No Redux store detected"
          description="Expose window.__REDUX_STORE__ or register an adapter."
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
            {data.hasGlobalStore && data.adapters.length === 0 ? (
              <li
                style={{
                  fontSize: 12,
                  padding: "6px 8px",
                  border: "1px dashed var(--border, #e4e4e7)",
                  borderRadius: 4,
                  color: "var(--muted, #71717a)",
                }}
              >
                Global Redux store detected (not yet bridged).
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}
