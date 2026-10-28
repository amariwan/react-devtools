import type { PluginRegistry } from "@next-devtools/core";
import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";

export interface AgentMcpHealthData {
  readonly plugins: ReadonlyArray<{
    readonly id: string;
    readonly status: string;
    readonly reason?: string;
  }>;
  readonly capabilities: ReadonlyArray<string>;
  readonly services: ReadonlyArray<{
    readonly id: string;
    readonly status: string;
    readonly reason?: string;
    readonly droppedEvents?: number;
  }>;
}

const SERVICE_IDS = [
  "next-devtools.runtime.react",
  "next-devtools.runtime.routes",
  "next-devtools.runtime.timeline",
  "next-devtools.runtime.network",
  "next-devtools.runtime.stores",
  "next-devtools.runtime.sessions",
  "next-devtools.runtime.diagnostics",
] as const;

export function buildAgentMcpHealthData(
  registry: PluginRegistry,
): AgentMcpHealthData {
  const services = SERVICE_IDS.map((id) => {
    const service = registry.services.get<{
      getSnapshot(): RuntimeServiceSnapshot<unknown>;
    }>(id);
    if (!service) return { id, status: "unavailable" };
    try {
      const snapshot = service.getSnapshot();
      const snapshotData = snapshot.data;
      const droppedEvents =
        snapshotData &&
        typeof snapshotData === "object" &&
        typeof (snapshotData as { dropped?: unknown }).dropped === "number"
          ? (snapshotData as { dropped: number }).dropped
          : undefined;
      return {
        id,
        status: snapshot.status,
        ...(snapshot.reason ? { reason: snapshot.reason } : {}),
        ...(droppedEvents !== undefined ? { droppedEvents } : {}),
      };
    } catch {
      return { id, status: "error", reason: "Snapshot failed" };
    }
  });

  return {
    plugins: registry.list().map(({ plugin, status, error }) => ({
      id: plugin.manifest.id,
      status,
      ...(error ? { reason: error.message } : {}),
    })),
    capabilities: registry.capabilities
      .list()
      .map(({ id }) => id)
      .sort(),
    services,
  };
}
