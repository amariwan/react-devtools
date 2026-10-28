import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const cssTailwindPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.css-tailwind",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "CSS/Tailwind",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "css-tailwind",
      title: "CSS/Tailwind",
      icon: "css",
      order: 40,
      load: async () => {
        const { default: Panel } = await import("./CssTailwindPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default cssTailwindPlugin;
