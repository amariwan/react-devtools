import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import type { DiagnosticsRuntime } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import { buildAgentMcpHealthData } from "./agent-mcp-data.js";
import { createAgentMcpToolSurface } from "./agent-mcp-tools.js";

export default function AgentMcpPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const [, refresh] = React.useReducer((value) => value + 1, 0);
  React.useEffect(() => {
    const disposers = [
      registry.capabilities.onChange(() => refresh()),
      registry.services.subscribe(() => refresh()),
    ];
    for (const id of [
      "next-devtools.runtime.react",
      "next-devtools.runtime.routes",
      "next-devtools.runtime.timeline",
      "next-devtools.runtime.network",
      "next-devtools.runtime.stores",
      "next-devtools.runtime.sessions",
      "next-devtools.runtime.diagnostics",
    ]) {
      const service = registry.services.get<{
        subscribe(listener: () => void): () => void;
      }>(id);
      if (service) disposers.push(service.subscribe(() => refresh()));
    }
    return () => disposers.forEach((dispose) => dispose());
  }, [registry]);

  const data = buildAgentMcpHealthData(registry);
  const tools = createAgentMcpToolSurface(registry).listTools();
  const diagnostics = registry.services.get<DiagnosticsRuntime>(
    RUNTIME_SERVICE_IDS.diagnostics,
  );
  const diagnosticEvents = diagnostics?.getSnapshot().data.events ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Agent / MCP</h2>
      <p style={{ fontSize: 13, color: "var(--muted, #71717a)" }}>
        Read-only diagnostics for an optional MCP adapter. No write or editor
        actions are exposed here.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {[
          ["Plugins", data.plugins.length],
          ["Capabilities", data.capabilities.length],
          [
            "Services",
            data.services.filter((service) => service.status === "available")
              .length,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              border: "1px solid var(--border, #e4e4e7)",
              borderRadius: 6,
              padding: 8,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--muted, #71717a)" }}>
              {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 6px" }}>
          Recent diagnostics
        </h3>
        {diagnosticEvents.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
            No browser errors or unhandled rejections captured.
          </p>
        ) : (
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
            {[...diagnosticEvents]
              .reverse()
              .slice(0, 20)
              .map((event) => (
                <li
                  key={event.id}
                  style={{
                    fontSize: 12,
                    padding: "6px 8px",
                    border: "1px solid var(--border, #e4e4e7)",
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontFamily: "monospace" }}>
                    {event.kind} · {event.name ?? "Error"}
                  </div>
                  <div>{event.message}</div>
                  {event.route ? (
                    <div style={{ color: "var(--muted, #71717a)" }}>
                      {event.route}
                    </div>
                  ) : null}
                  {event.sourceFrame ? (
                    <div style={{ color: "var(--muted, #71717a)" }}>
                      {event.sourceFrame.origin === "source-map"
                        ? "Source-mapped frame"
                        : "Unmapped stack frame"}
                      : {event.sourceFrame.source}:{event.sourceFrame.line}:
                      {event.sourceFrame.column}
                    </div>
                  ) : (
                    <div style={{ color: "var(--muted, #71717a)" }}>
                      Source location unavailable
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </section>
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 6px" }}>
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
          {data.services.map((service) => (
            <li
              key={service.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 12,
                padding: "4px 6px",
                border: "1px solid var(--border, #e4e4e7)",
                borderRadius: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {service.id}
              </span>
              <span title={service.reason}>
                {service.status}
                {service.droppedEvents !== undefined
                  ? ` · ${service.droppedEvents} dropped`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: "4px 0 6px" }}>
          Plugins
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
          {data.plugins.map((plugin) => (
            <li
              key={plugin.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                fontSize: 12,
              }}
            >
              <span style={{ fontFamily: "monospace" }}>{plugin.id}</span>
              <span title={plugin.reason}>
                {plugin.status}
                {plugin.reason ? ` · ${plugin.reason}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <div
        style={{
          padding: 12,
          border: "1px dashed var(--border, #e4e4e7)",
          borderRadius: 6,
          fontSize: 13,
          color: "var(--muted, #71717a)",
          textAlign: "center",
        }}
      >
        Read-only tools: {tools.map((tool) => tool.name).join(", ")}. Transport
        is not enabled by this panel.
      </div>
    </div>
  );
}
