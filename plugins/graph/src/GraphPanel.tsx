import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { ReactRuntimeService } from "@next-devtools/runtime-react";
import { EmptyState } from "@next-devtools/ui";
import { buildGraphData } from "./graph-data.js";

export default function GraphPanel({ registry }: { registry: PluginRegistry }) {
  const service = registry.services.get<ReactRuntimeService>(
    RUNTIME_SERVICE_IDS.react,
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

  const data = React.useMemo(() => buildGraphData(snapshot), [snapshot]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Graph</h2>
      <p style={{ fontSize: 13, color: "var(--muted, #71717a)", margin: 0 }}>
        Render / owner / context relations are shown only where evidence exists.
        No invented edges.
      </p>
      <div style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
        {data.nodeCount} nodes · {data.edgeCount} edges
      </div>
      {data.nodes.length === 0 ? (
        <EmptyState
          title="No graph data"
          description={data.reason ?? "React bridge must be connected."}
        />
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxHeight: 420,
            overflow: "auto",
          }}
        >
          {data.nodes.map((node) => (
            <li
              key={node.id}
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
              <span>{node.displayName}</span>
              <span style={{ color: "var(--muted, #71717a)" }}>
                {node.kind}
                {node.hasState ? " · state" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
