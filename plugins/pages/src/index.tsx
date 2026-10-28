import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const pagesPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.pages",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Pages",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "pages",
      title: "Pages",
      icon: "pages",
      order: 2,
      load: async () => {
        const { default: PagesPanel } = await import("./PagesPanel.js");
        return { default: PagesPanel };
      },
    });
  },
};

export default pagesPlugin;
