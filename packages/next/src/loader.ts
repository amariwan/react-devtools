import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";
import { builtInPluginManifest, type BuiltInPluginEntry } from "./manifest.js";
import { detectIntegration } from "./detect.js";

export async function loadBuiltInPlugins(
  manifest: BuiltInPluginEntry[] = builtInPluginManifest,
): Promise<DevtoolsPlugin[]> {
  const plugins: DevtoolsPlugin[] = [];
  for (const entry of manifest) {
    if (entry.optional && entry.integration) {
      const ok = await detectIntegration(entry.integration).catch(() => false);
      if (!ok) continue;
    }
    try {
      const plugin = await entry.load();
      plugins.push(plugin);
    } catch (error) {
      // Skip unavailable optional plugins, but never fail silently.
      console.error(`[next-devtools] failed to load plugin ${entry.id}`, error);
      if (!entry.optional) {
        throw error;
      }
    }
  }
  return plugins;
}

export const loadPlugins = loadBuiltInPlugins;

export async function loadPlugin(
  entry: BuiltInPluginEntry,
): Promise<DevtoolsPlugin | null> {
  try {
    if (entry.optional && entry.integration) {
      const ok = await detectIntegration(entry.integration).catch(() => false);
      if (!ok) return null;
    }
    return await entry.load();
  } catch (error) {
    if (!entry.optional) {
      throw error;
    }
    console.error(`[next-devtools] failed to load plugin ${entry.id}`, error);
    return null;
  }
}
