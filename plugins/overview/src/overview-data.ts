import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";

export interface OverviewRow {
  readonly label: string;
  readonly value: string | number;
}

export interface OverviewData {
  readonly connectionStatus: "connected" | "disconnected";
  readonly rows: readonly OverviewRow[];
  readonly services: readonly { id: string; status: string }[];
  readonly health: {
    readonly failedPlugins: readonly { id: string; message: string }[];
    readonly unavailableServices: readonly string[];
    readonly errorServices: readonly string[];
    readonly droppedDiagnostics: number;
    readonly diagnosticCount: number;
    readonly sourceMappedDiagnosticCount: number;
  };
}

function boundedMessage(message: string): string {
  return message.length <= 240 ? message : `${message.slice(0, 240)}…`;
}

export function buildOverviewData(registry: PluginRegistry): OverviewData {
  const plugins = registry.list();
  const panels = registry.panels.list();
  const commands = registry.commands.list();
  const caps = registry.capabilities.list();

  const serviceIds = [
    RUNTIME_SERVICE_IDS.react,
    RUNTIME_SERVICE_IDS.routes,
    RUNTIME_SERVICE_IDS.network,
    RUNTIME_SERVICE_IDS.stores,
    RUNTIME_SERVICE_IDS.timeline,
    RUNTIME_SERVICE_IDS.sessions,
    RUNTIME_SERVICE_IDS.diagnostics,
  ];
  const services: { id: string; status: string }[] = [];
  for (const id of serviceIds) {
    const service = registry.services.get<unknown>(id);
    if (!service) {
      services.push({ id, status: "unavailable" });
      continue;
    }
    try {
      const snapshot = (
        service as { getSnapshot(): RuntimeServiceSnapshot<unknown> }
      ).getSnapshot();
      services.push({ id, status: snapshot.status });
    } catch {
      services.push({ id, status: "error" });
    }
  }

  const reactService = registry.services.get<{
    getSnapshot(): RuntimeServiceSnapshot<{
      capabilities?: { tree?: boolean };
    }>;
  }>(RUNTIME_SERVICE_IDS.react);
  let reactStatus: string;
  try {
    reactStatus = reactService?.getSnapshot().status ?? "unavailable";
  } catch {
    reactStatus = "error";
  }
  const connectionStatus: "connected" | "disconnected" =
    reactStatus === "available" || reactStatus === "partial"
      ? "connected"
      : "disconnected";

  const failedPlugins = plugins
    .filter((plugin) => plugin.status === "error")
    .map((plugin) => ({
      id: plugin.plugin.manifest.id,
      message: boundedMessage(plugin.error?.message ?? "Activation failed"),
    }));
  const unavailableServices = services
    .filter((service) => service.status === "unavailable")
    .map((service) => service.id);
  const errorServices = services
    .filter((service) => service.status === "error")
    .map((service) => service.id);
  const diagnosticsService = registry.services.get<{
    getSnapshot(): RuntimeServiceSnapshot<{
      events?: readonly { sourceFrame?: { origin: string } }[];
      dropped?: number;
    }>;
  }>(RUNTIME_SERVICE_IDS.diagnostics);
  let diagnosticCount = 0;
  let sourceMappedDiagnosticCount = 0;
  let droppedDiagnostics = 0;
  try {
    const snapshot = diagnosticsService?.getSnapshot();
    diagnosticCount = snapshot?.data.events?.length ?? 0;
    sourceMappedDiagnosticCount =
      snapshot?.data.events?.filter(
        (event) => event.sourceFrame?.origin === "source-map",
      ).length ?? 0;
    droppedDiagnostics = snapshot?.data.dropped ?? 0;
  } catch {
    // The service status above reports a service read failure.
  }

  const rows: OverviewRow[] = [
    { label: "Plugins registered", value: plugins.length },
    { label: "Panels", value: panels.length },
    { label: "Commands", value: commands.length },
    { label: "Capabilities", value: caps.length },
    { label: "Connection", value: connectionStatus },
    {
      label: "Runtime services",
      value: services.filter((s) => s.status === "available").length,
    },
  ];

  return {
    connectionStatus,
    rows,
    services,
    health: {
      failedPlugins,
      unavailableServices,
      errorServices,
      droppedDiagnostics,
      diagnosticCount,
      sourceMappedDiagnosticCount,
    },
  };
}
