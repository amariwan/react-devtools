import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const componentsPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.components",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Components",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "components",
      title: "Components",
      icon: "components",
      order: 1,
      load: async () => {
        const { default: ComponentsPanel } =
          await import("./ComponentsPanel.js");
        return { default: ComponentsPanel };
      },
    });
  },
};

export default componentsPlugin;
