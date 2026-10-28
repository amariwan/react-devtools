import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const graphPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.graph",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Graph",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "graph",
      title: "Graph",
      icon: "graph",
      order: 30,
      load: async () => {
        const { default: Panel } = await import("./GraphPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default graphPlugin;
