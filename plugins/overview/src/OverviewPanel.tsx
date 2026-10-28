import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import { buildOverviewData } from "./overview-data.js";

export default function OverviewPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const [, refresh] = React.useReducer((value) => value + 1, 0);
  React.useEffect(() => {
    const disposers = [
      registry.onChange(() => refresh()),
      registry.panels.onChange(() => refresh()),
      registry.capabilities.onChange(() => refresh()),
      registry.services.subscribe(() => refresh()),
    ];
    for (const id of [
      RUNTIME_SERVICE_IDS.react,
      RUNTIME_SERVICE_IDS.routes,
      RUNTIME_SERVICE_IDS.network,
      RUNTIME_SERVICE_IDS.stores,
      RUNTIME_SERVICE_IDS.timeline,
      RUNTIME_SERVICE_IDS.sessions,
      RUNTIME_SERVICE_IDS.diagnostics,
    ]) {
      const runtimeService = registry.services.get<{
        subscribe(listener: () => void): () => void;
      }>(id);
      if (runtimeService)
        disposers.push(runtimeService.subscribe(() => refresh()));
    }
    return () => disposers.forEach((dispose) => dispose());
  }, [registry]);

  const data = buildOverviewData(registry);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Overview
        </h2>
        <p
          style={{
            color: "var(--muted, #71717a)",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          Live runtime summary. Connection reflects the React bridge.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 8,
          }}
        >
          {data.rows.map((row) => (
            <div
              key={row.label}
              style={{
                border: "1px solid var(--border, #e4e4e7)",
                borderRadius: 6,
                padding: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted, #71717a)",
                  marginBottom: 4,
                }}
              >
                {row.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{row.value}</div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Runtime services
        </h3>
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
          {data.services.map((s) => (
            <li
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                padding: "4px 6px",
                border: "1px solid var(--border, #e4e4e7)",
                borderRadius: 4,
              }}
            >
              <span style={{ fontFamily: "monospace" }}>{s.id}</span>
              <span>{s.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Health
        </h3>
        <div
          style={{
            fontSize: 12,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div>
            Diagnostics: {data.health.diagnosticCount} captured,{" "}
            {data.health.sourceMappedDiagnosticCount} source-mapped,{" "}
            {data.health.droppedDiagnostics} dropped
          </div>
          {data.health.failedPlugins.map((plugin) => (
            <div
              key={`plugin:${plugin.id}`}
              style={{ color: "var(--danger, #dc2626)" }}
            >
              Plugin {plugin.id} failed: {plugin.message}
            </div>
          ))}
          {data.health.unavailableServices.map((id) => (
            <div key={`unavailable:${id}`}>Service unavailable: {id}</div>
          ))}
          {data.health.errorServices.map((id) => (
            <div
              key={`error:${id}`}
              style={{ color: "var(--danger, #dc2626)" }}
            >
              Service error: {id}
            </div>
          ))}
          {data.health.failedPlugins.length === 0 &&
            data.health.unavailableServices.length === 0 &&
            data.health.errorServices.length === 0 &&
            data.health.droppedDiagnostics === 0 && (
              <div style={{ color: "var(--success, #16a34a)" }}>
                No runtime health issues detected.
              </div>
            )}
        </div>
      </section>
    </div>
  );
}
