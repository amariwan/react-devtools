import type { PluginContext } from "./context.js";
import type { PluginManifest } from "./manifest.js";

export interface DevtoolsPlugin {
	manifest: PluginManifest;
	setup(
		ctx: PluginContext,
	): void | (() => void) | Promise<undefined | (() => void)>;
}
