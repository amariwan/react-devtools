import showcaseCustomPlugin from "@next-devtools/plugin-showcase-custom-inspector";
import { extendPluginManifest } from "next-devtools/manifest";

extendPluginManifest([
	{
		id: showcaseCustomPlugin.manifest.id,
		displayName: showcaseCustomPlugin.manifest.displayName,
		load: async () => showcaseCustomPlugin,
	},
]);

// Load the normal auto-mount only after the showcase plugin is available.
void import("next-devtools/instrumentation-client");
