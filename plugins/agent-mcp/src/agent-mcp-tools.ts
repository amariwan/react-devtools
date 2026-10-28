import {
  buildProfilerInsights,
  captureDebugSession,
  type DiagnosticsRuntimeSnapshot,
  type NetworkRuntimeSnapshot,
  type PluginRegistry,
  type StoreSnapshot,
  type TimelineEvent,
} from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import { buildAgentMcpHealthData } from "./agent-mcp-data.js";

export type AgentMcpToolName =
  | "runtime-health"
  | "list-apps"
  | "list-plugins"
  | "component-tree"
  | "component-detail"
  | "component-source"
  | "routes"
  | "timeline"
  | "network-requests"
  | "inspect-store"
  | "recent-errors"
  | "export-debug-session"
  | "profiler-summary";

export interface AgentMcpToolDescriptor {
  readonly name: AgentMcpToolName;
  readonly description: string;
  readonly safety: "read";
}

export type AgentMcpToolResult =
  | { readonly ok: true; readonly data: unknown }
  | {
      readonly ok: false;
      readonly code: "invalid-input" | "unavailable";
      readonly reason: string;
    };

export interface AgentMcpToolSurface {
  listTools(): readonly AgentMcpToolDescriptor[];
  call(name: AgentMcpToolName, input?: unknown): Promise<AgentMcpToolResult>;
  callUnknown(name: unknown, input?: unknown): Promise<AgentMcpToolResult>;
}

const TOOL_DESCRIPTORS: readonly AgentMcpToolDescriptor[] = [
  {
    name: "runtime-health",
    description: "Read runtime service, plugin, and capability health.",
    safety: "read",
  },
  {
    name: "list-apps",
    description: "List connected app sessions.",
    safety: "read",
  },
  {
    name: "list-plugins",
    description: "List registered plugins and lifecycle status.",
    safety: "read",
  },
  {
    name: "component-tree",
    description: "Read a bounded React component tree.",
    safety: "read",
  },
  {
    name: "component-detail",
    description: "Read sanitized detail for one React component.",
    safety: "read",
  },
  {
    name: "component-source",
    description: "Read source evidence for one React component.",
    safety: "read",
  },
  {
    name: "routes",
    description: "Read the static route tree and active location.",
    safety: "read",
  },
  {
    name: "timeline",
    description: "Read a bounded tail of timeline events.",
    safety: "read",
  },
  {
    name: "network-requests",
    description: "Read a bounded tail of sanitized resource timing entries.",
    safety: "read",
  },
  {
    name: "inspect-store",
    description: "Read the selected bounded encoded state snapshot.",
    safety: "read",
  },
  {
    name: "recent-errors",
    description: "Read a bounded list of sanitized runtime errors.",
    safety: "read",
  },
  {
    name: "export-debug-session",
    description: "Export a bounded sanitized runtime evidence package.",
    safety: "read",
  },
  {
    name: "profiler-summary",
    description: "Summarize recorded React Profiler timing events.",
    safety: "read",
  },
];

const TOOL_NAMES = new Set<AgentMcpToolName>(
  TOOL_DESCRIPTORS.map((tool) => tool.name),
);

export function isAgentMcpToolName(value: unknown): value is AgentMcpToolName {
  return typeof value === "string" && TOOL_NAMES.has(value as AgentMcpToolName);
}

type ReactToolService = {
  getSnapshot(): RuntimeServiceSnapshot<{
    roots: readonly string[];
    tree: readonly unknown[];
  }>;
  readTree(rootId: string): Promise<unknown[]>;
  readDetail(id: string): Promise<unknown>;
  readSource(id: string): Promise<unknown>;
};

function boundedLimit(input: unknown): number {
  if (!input || typeof input !== "object") return 50;
  const value = (input as { limit?: unknown }).limit;
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(1, Math.floor(value)))
    : 50;
}

function stringInput(input: unknown, key: string): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function validateAgentMcpInput(
  name: AgentMcpToolName,
  input: unknown,
):
  { ok: true; value: Record<string, unknown> } | { ok: false; reason: string } {
  if (input === undefined) return { ok: true, value: {} };
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { ok: false, reason: "Tool input must be an object" };
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value);
  const allowed = new Set(
    name === "component-tree"
      ? ["rootId", "limit"]
      : name === "component-detail" || name === "component-source"
        ? ["id"]
        : ["limit"],
  );
  if (keys.some((key) => !allowed.has(key)))
    return { ok: false, reason: "Tool input contains an unsupported field" };
  if ("limit" in value) {
    const limit = value.limit;
    if (
      typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
      return { ok: false, reason: "limit must be an integer from 1 to 100" };
  }
  for (const key of ["id", "rootId"]) {
    if (key in value && (typeof value[key] !== "string" || !value[key]))
      return { ok: false, reason: `${key} must be a non-empty string` };
    if (key in value && (value[key] as string).length > 256)
      return { ok: false, reason: `${key} is too long` };
  }
  return { ok: true, value };
}

export function createAgentMcpToolSurface(
  registry: PluginRegistry,
): AgentMcpToolSurface {
  return {
    listTools(): readonly AgentMcpToolDescriptor[] {
      return TOOL_DESCRIPTORS;
    },
    async call(
      name: AgentMcpToolName,
      input: unknown = {},
    ): Promise<AgentMcpToolResult> {
      try {
        switch (name) {
          case "runtime-health":
            return { ok: true, data: buildAgentMcpHealthData(registry) };
          case "list-plugins":
            return {
              ok: true,
              data: registry.list().map(({ plugin, status }) => ({
                id: plugin.manifest.id,
                displayName: plugin.manifest.displayName,
                status,
              })),
            };
          case "list-apps": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<unknown>;
            }>(RUNTIME_SERVICE_IDS.sessions);
            return {
              ok: true,
              data: service?.getSnapshot().data ?? { sessions: [] },
            };
          }
          case "routes": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<unknown>;
            }>(RUNTIME_SERVICE_IDS.routes);
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "Route service unavailable",
              };
            return { ok: true, data: service.getSnapshot() };
          }
          case "timeline": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<{
                events: readonly unknown[];
              }>;
            }>(RUNTIME_SERVICE_IDS.timeline);
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "Timeline service unavailable",
              };
            const snapshot = service.getSnapshot();
            return {
              ok: true,
              data: {
                ...snapshot,
                data: {
                  ...snapshot.data,
                  events: snapshot.data.events.slice(-boundedLimit(input)),
                },
              },
            };
          }
          case "network-requests": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<NetworkRuntimeSnapshot>;
            }>(RUNTIME_SERVICE_IDS.network);
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "Network service unavailable",
              };
            const snapshot = service.getSnapshot();
            return {
              ok: true,
              data: {
                ...snapshot,
                data: {
                  ...snapshot.data,
                  entries: snapshot.data.entries.slice(-boundedLimit(input)),
                },
              },
            };
          }
          case "inspect-store": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<StoreSnapshot>;
            }>(RUNTIME_SERVICE_IDS.stores);
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "Store service unavailable",
              };
            const snapshot = service.getSnapshot();
            if (
              !snapshot.data.selectedAdapterId ||
              snapshot.data.value === undefined
            )
              return {
                ok: false,
                code: "unavailable",
                reason: "No store snapshot selected",
              };
            return { ok: true, data: snapshot };
          }
          case "recent-errors": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<DiagnosticsRuntimeSnapshot>;
            }>(RUNTIME_SERVICE_IDS.diagnostics);
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "Diagnostics service unavailable",
              };
            const snapshot = service.getSnapshot();
            return {
              ok: true,
              data: {
                ...snapshot,
                data: {
                  ...snapshot.data,
                  events: snapshot.data.events.slice(-boundedLimit(input)),
                },
              },
            };
          }
          case "export-debug-session": {
            const limit = boundedLimit(input);
            const timeline = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<{
                events: readonly unknown[];
              }>;
            }>(RUNTIME_SERVICE_IDS.timeline);
            const network = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<NetworkRuntimeSnapshot>;
            }>(RUNTIME_SERVICE_IDS.network);
            const stores = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<StoreSnapshot>;
            }>(RUNTIME_SERVICE_IDS.stores);
            const diagnostics = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<DiagnosticsRuntimeSnapshot>;
            }>(RUNTIME_SERVICE_IDS.diagnostics);
            const timelineSnapshot = timeline?.getSnapshot();
            const networkSnapshot = network?.getSnapshot();
            const storeSnapshot = stores?.getSnapshot();
            const diagnosticsSnapshot = diagnostics?.getSnapshot();
            const capturedAtUnixMs = Date.now();
            const debugSession = captureDebugSession({
              sessionId: `agent_export_${capturedAtUnixMs}`,
              capturedAtUnixMs,
              limit,
              ...(timelineSnapshot
                ? {
                    timeline: timelineSnapshot.data
                      .events as readonly TimelineEvent[],
                  }
                : {}),
              ...(networkSnapshot
                ? { network: networkSnapshot.data.entries }
                : {}),
              ...(diagnosticsSnapshot
                ? { diagnostics: diagnosticsSnapshot.data.events }
                : {}),
            });
            return {
              ok: true,
              data: {
                capturedAtUnixMs,
                debugSession,
                health: buildAgentMcpHealthData(registry),
                timeline: timelineSnapshot
                  ? {
                      ...timelineSnapshot,
                      data: {
                        ...timelineSnapshot.data,
                        events: timelineSnapshot.data.events.slice(-limit),
                      },
                    }
                  : {
                      status: "unavailable",
                      reason: "Timeline service unavailable",
                    },
                network: networkSnapshot
                  ? {
                      ...networkSnapshot,
                      data: {
                        ...networkSnapshot.data,
                        entries: networkSnapshot.data.entries.slice(-limit),
                      },
                    }
                  : {
                      status: "unavailable",
                      reason: "Network service unavailable",
                    },
                store:
                  storeSnapshot?.data.selectedAdapterId &&
                  storeSnapshot.data.value !== undefined
                    ? storeSnapshot
                    : {
                        status: "unavailable",
                        reason: "No store snapshot selected",
                      },
                errors: diagnosticsSnapshot
                  ? {
                      ...diagnosticsSnapshot,
                      data: {
                        ...diagnosticsSnapshot.data,
                        events: diagnosticsSnapshot.data.events.slice(-limit),
                      },
                    }
                  : {
                      status: "unavailable",
                      reason: "Diagnostics service unavailable",
                    },
              },
            };
          }
          case "profiler-summary": {
            const service = registry.services.get<{
              getSnapshot(): RuntimeServiceSnapshot<{
                events: readonly TimelineEvent[];
              }>;
            }>(RUNTIME_SERVICE_IDS.timeline);
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "Timeline service unavailable",
              };
            const insights = buildProfilerInsights(
              service.getSnapshot().data.events,
            );
            return {
              ok: true,
              data: insights,
            };
          }
          case "component-tree": {
            const service = registry.services.get<ReactToolService>(
              RUNTIME_SERVICE_IDS.react,
            );
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "React service unavailable",
              };
            const rootId =
              stringInput(input, "rootId") ??
              service.getSnapshot().data.roots[0];
            if (!rootId)
              return {
                ok: false,
                code: "unavailable",
                reason: "No React root available",
              };
            const tree = await service.readTree(rootId);
            return {
              ok: true,
              data: { rootId, nodes: tree.slice(0, boundedLimit(input)) },
            };
          }
          case "component-detail":
          case "component-source": {
            const id = stringInput(input, "id");
            if (!id)
              return {
                ok: false,
                code: "invalid-input",
                reason: "A component id is required",
              };
            const service = registry.services.get<ReactToolService>(
              RUNTIME_SERVICE_IDS.react,
            );
            if (!service)
              return {
                ok: false,
                code: "unavailable",
                reason: "React service unavailable",
              };
            const data =
              name === "component-detail"
                ? await service.readDetail(id)
                : await service.readSource(id);
            return data === undefined
              ? {
                  ok: false,
                  code: "unavailable",
                  reason: "Component data unavailable",
                }
              : { ok: true, data };
          }
        }
      } catch {
        return {
          ok: false,
          code: "unavailable",
          reason: "Tool execution failed",
        };
      }
    },
    async callUnknown(
      name: unknown,
      input: unknown = {},
    ): Promise<AgentMcpToolResult> {
      if (!isAgentMcpToolName(name)) {
        return {
          ok: false,
          code: "invalid-input",
          reason: "Unknown read-only tool",
        };
      }
      const validation = validateAgentMcpInput(name, input);
      if (!validation.ok) {
        return { ok: false, code: "invalid-input", reason: validation.reason };
      }
      return this.call(name, input);
    },
  };
}
