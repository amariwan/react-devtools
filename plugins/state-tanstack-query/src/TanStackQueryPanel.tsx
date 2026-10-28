import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import { EmptyState, StoreInspector } from "@next-devtools/ui";
import { buildTanStackQueryData } from "./tanstack-query-data.js";

export default function TanStackQueryPanel({
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

  const globalDetected = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as Record<string, unknown>;
    return Boolean(w.__TANSTACK_QUERY_CLIENT__ ?? w.__REACT_QUERY_CLIENT__);
  }, []);

  const data = React.useMemo(
    () => buildTanStackQueryData(snapshot, globalDetected),
    [snapshot, globalDetected],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        TanStack Query
      </h2>
      <div style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
        {data.adapters.length} registered adapters
        {data.globalDetected ? " · QueryClient detected" : ""}
      </div>
      {!data.hasData ? (
        <EmptyState
          title="No TanStack Query client detected"
          description="Expose a QueryClient global or register an adapter."
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
            {data.globalDetected && data.adapters.length === 0 ? (
              <li
                style={{
                  fontSize: 12,
                  padding: "6px 8px",
                  border: "1px dashed var(--border, #e4e4e7)",
                  borderRadius: 4,
                  color: "var(--muted, #71717a)",
                }}
              >
                QueryClient detected (not yet bridged).
              </li>
            ) : null}
          </ul>
        </>
      )}
    </div>
  );
}
