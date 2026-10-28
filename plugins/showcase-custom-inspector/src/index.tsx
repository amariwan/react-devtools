import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const showcaseCustomPlugin: DevtoolsPlugin = {
  manifest: {
    id: "showcase.custom-inspector",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Showcase Custom Inspector",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "showcase-custom",
      title: "Showcase Custom",
      icon: "sparkles",
      order: 99,
      load: async () => {
        const { default: Panel } = await import("./ShowcaseCustomPanel.js");
        return { default: Panel };
      },
    });
    ctx.commands.register({
      id: "showcase.custom.hello",
      title: "Showcase: Hello Command",
      safety: "read",
      run: () => {
        ctx.timeline.emit({
          layer: "showcase",
          type: "custom-event",
          payload: { message: "hello from custom plugin" },
        });
      },
    });
    ctx.settings.register({
      namespace: "showcase.custom",
      defaults: { greeting: "Hello" },
    });
    ctx.timeline.registerLayer({
      id: "showcase",
      label: "Showcase",
      schema: { message: "string" },
    });
  },
};

export default showcaseCustomPlugin;
