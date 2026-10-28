import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export type {
  DevtoolsPlugin,
  PluginManifest,
  PluginContext,
} from "@next-devtools/plugin-sdk";
export type {
  PanelDescriptor,
  PanelRegistry,
  InspectorRegistry,
  TimelineRegistry,
  CommandRegistry,
  SettingsRegistry,
  PluginStateStore,
  TypedEventBus,
  ServiceLookup,
  PermissionClient,
} from "@next-devtools/plugin-sdk";

export function definePlugin(plugin: DevtoolsPlugin): DevtoolsPlugin {
  return plugin;
}

export const createPlugin = definePlugin;
