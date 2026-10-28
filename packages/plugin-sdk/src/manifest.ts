export type PluginTarget = "browser" | "node" | "ui";
export type PluginActivation = "on-demand" | "on-start" | "on-capability";
export type PluginPermission =
  "read-state" | "write-state" | "open-editor" | "server-diagnostics";

export type PluginManifest = {
  id: string; // namespaced, e.g. "org.example.my-inspector"
  version: string;
  sdkRange: string;
  displayName: string;
  icon?: string;
  targets: PluginTarget[];
  requiredCapabilities?: string[];
  permissions?: PluginPermission[];
  activation?: PluginActivation;
};
