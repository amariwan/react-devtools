import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const overviewPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.overview",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Overview",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "overview",
      title: "Overview",
      icon: "overview",
      order: 0,
      load: async () => {
        const { default: OverviewPanel } = await import("./OverviewPanel.js");
        return { default: OverviewPanel };
      },
    });
    ctx.panels.register({
      id: "timeline",
      title: "Timeline",
      icon: "timeline",
      order: 30,
      load: async () => {
        const { default: TimelinePanel } = await import("./TimelinePanel.js");
        return { default: TimelinePanel };
      },
    });
  },
};

export default overviewPlugin;
