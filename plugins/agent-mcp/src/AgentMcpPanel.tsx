import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import type { DiagnosticsRuntime } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import {
  Badge,
  EmptyState,
  PanelHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@next-devtools/ui";
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
    <div className="devtools:flex devtools:min-h-0 devtools:flex-col">
      <PanelHeader
        title="Agent / MCP"
        description="Read-only runtime diagnostics. MCP transport is not enabled by this panel."
        actions={
          <Badge variant="secondary">
            {
              data.services.filter((service) => service.status === "available")
                .length
            }{" "}
            services available
          </Badge>
        }
      />
      <section
        aria-labelledby="diagnostics-heading"
        className="devtools:border-b devtools:border-border"
      >
        <h3
          id="diagnostics-heading"
          className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:font-semibold"
        >
          Recent diagnostics{" "}
          <Badge variant="outline">{diagnosticEvents.length}</Badge>
        </h3>
        {diagnosticEvents.length === 0 ? (
          <EmptyState
            title="No errors captured"
            description="Browser errors and unhandled rejections will appear here."
          />
        ) : (
          <ul className="devtools:m-0 devtools:list-none devtools:divide-y devtools:divide-border devtools:p-0">
            {[...diagnosticEvents]
              .reverse()
              .slice(0, 20)
              .map((event) => (
                <li
                  key={event.id}
                  className="devtools:space-y-1 devtools:px-3 devtools:py-2 devtools:text-xs"
                >
                  <div className="devtools:flex devtools:items-center devtools:gap-2">
                    <Badge variant="destructive">{event.kind}</Badge>
                    <span className="devtools:font-medium">
                      {event.name ?? "Error"}
                    </span>
                  </div>
                  <p className="devtools:break-words">{event.message}</p>
                  {event.route && (
                    <p className="devtools:font-mono devtools:text-muted-foreground">
                      {event.route}
                    </p>
                  )}
                  <p className="devtools:break-all devtools:font-mono devtools:text-muted-foreground">
                    {event.sourceFrame
                      ? `${event.sourceFrame.origin === "source-map" ? "Source-mapped" : "Unmapped"}: ${event.sourceFrame.source}:${event.sourceFrame.line}:${event.sourceFrame.column}`
                      : "Source location unavailable"}
                  </p>
                </li>
              ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="services-heading">
        <h3
          id="services-heading"
          className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:font-semibold"
        >
          Runtime services
        </h3>
        <div className="devtools:overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="devtools:font-mono devtools:text-xs">
                    {service.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        service.status === "error" ? "destructive" : "outline"
                      }
                    >
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="devtools:text-xs devtools:text-muted-foreground">
                    {service.reason}
                    {service.droppedEvents !== undefined
                      ? ` · ${service.droppedEvents} dropped`
                      : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section aria-labelledby="plugins-heading">
        <h3
          id="plugins-heading"
          className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:font-semibold"
        >
          Plugins <Badge variant="outline">{data.plugins.length}</Badge>
        </h3>
        <div className="devtools:overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plugin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.plugins.map((plugin) => (
                <TableRow key={plugin.id}>
                  <TableCell className="devtools:font-mono devtools:text-xs">
                    {plugin.id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{plugin.status}</Badge>
                  </TableCell>
                  <TableCell className="devtools:text-xs devtools:text-muted-foreground">
                    {plugin.reason ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      <section
        aria-labelledby="tools-heading"
        className="devtools:border-t devtools:border-border devtools:p-3"
      >
        <h3
          id="tools-heading"
          className="devtools:mb-2 devtools:text-xs devtools:font-semibold"
        >
          Read-only tools <Badge variant="outline">{tools.length}</Badge>
        </h3>
        <ul className="devtools:flex devtools:list-none devtools:flex-wrap devtools:gap-2 devtools:p-0">
          {tools.map((tool) => (
            <li key={tool.name}>
              <Badge variant="secondary" className="devtools:font-mono">
                {tool.name}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="devtools:mt-2 devtools:text-xs devtools:text-muted-foreground">
          {data.capabilities.length} capabilities registered.
        </p>
      </section>
    </div>
  );
}
