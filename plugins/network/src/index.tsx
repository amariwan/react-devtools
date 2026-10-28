import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const networkPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.network",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Network",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "network",
      title: "Network",
      icon: "network",
      order: 20,
      load: async () => {
        const { default: Panel } = await import("./NetworkPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default networkPlugin;
