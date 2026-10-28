import type { PluginManifest } from "./manifest.js";
import type { PluginContext } from "./context.js";

export interface DevtoolsPlugin {
  manifest: PluginManifest;
  setup(ctx: PluginContext): void | (() => void) | Promise<void | (() => void)>;
}
