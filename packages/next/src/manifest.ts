import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export type BuiltInPluginId =
  | "next-devtools.overview"
  | "next-devtools.components"
  | "next-devtools.pages"
  | "next-devtools.graph"
  | "next-devtools.network"
  | "next-devtools.css-tailwind"
  | "next-devtools.state.zustand"
  | "next-devtools.state.redux"
  | "next-devtools.state.tanstack-query"
  | "next-devtools.agent-mcp";

export type OptionalIntegration =
  "zustand" | "redux" | "tanstack-query" | "tailwindcss";

export interface BuiltInPluginEntry {
  id: BuiltInPluginId | string;
  displayName: string;
  optional?: boolean;
  integration?: OptionalIntegration;
  load: () => Promise<DevtoolsPlugin>;
}

// Centralized, extensible plugin manifest. Consumers/third-parties can append.
export const builtInPluginManifest: BuiltInPluginEntry[] = [
  {
    id: "next-devtools.overview",
    displayName: "Overview",
    load: async () => (await import("@next-devtools/plugin-overview")).default,
  },
  {
    id: "next-devtools.components",
    displayName: "Components",
    load: async () =>
      (await import("@next-devtools/plugin-components")).default,
  },
  {
    id: "next-devtools.pages",
    displayName: "Pages",
    load: async () => (await import("@next-devtools/plugin-pages")).default,
  },
  {
    id: "next-devtools.graph",
    displayName: "Graph",
    load: async () => (await import("@next-devtools/plugin-graph")).default,
  },
  {
    id: "next-devtools.network",
    displayName: "Network",
    load: async () => (await import("@next-devtools/plugin-network")).default,
  },
  {
    id: "next-devtools.css-tailwind",
    displayName: "CSS/Tailwind",
    optional: true,
    integration: "tailwindcss",
    load: async () =>
      (await import("@next-devtools/plugin-css-tailwind")).default,
  },
  {
    id: "next-devtools.state.zustand",
    displayName: "Zustand",
    optional: true,
    integration: "zustand",
    load: async () =>
      (await import("@next-devtools/plugin-state-zustand")).default,
  },
  {
    id: "next-devtools.state.redux",
    displayName: "Redux",
    optional: true,
    integration: "redux",
    load: async () =>
      (await import("@next-devtools/plugin-state-redux")).default,
  },
  {
    id: "next-devtools.state.tanstack-query",
    displayName: "TanStack Query",
    optional: true,
    integration: "tanstack-query",
    load: async () =>
      (await import("@next-devtools/plugin-state-tanstack-query")).default,
  },
  {
    id: "next-devtools.agent-mcp",
    displayName: "Agent / MCP",
    load: async () => (await import("@next-devtools/plugin-agent-mcp")).default,
  },
];

export function registerBuiltInPlugin(entry: BuiltInPluginEntry): void {
  if (!builtInPluginManifest.some((e) => e.id === entry.id)) {
    builtInPluginManifest.push(entry);
  }
}

export function extendPluginManifest(entries: BuiltInPluginEntry[]): void {
  for (const entry of entries) registerBuiltInPlugin(entry);
}

// Compatibility aliases
export const pluginManifest = builtInPluginManifest;
export const builtinPlugins = builtInPluginManifest;
export const builtinPluginManifest = builtInPluginManifest;
