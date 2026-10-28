import { describe, it, expect } from "vitest";
import {
  createCoreRuntimeServices,
  createPluginRegistry,
  createServiceLookup,
} from "@next-devtools/core";
import {
  RUNTIME_SERVICE_IDS,
  type RuntimeService,
} from "@next-devtools/contracts";
import type { DevtoolsPlugin, PluginContext } from "@next-devtools/plugin-sdk";

function makePlugin(
  id: string,
  activation: "on-start" | "on-demand" = "on-demand",
  setup?: (ctx: unknown) => void,
): DevtoolsPlugin {
  return {
    manifest: {
      id,
      version: "0.0.1",
      sdkRange: ">=0.0.0",
      displayName: id,
      targets: ["browser", "ui"],
      activation,
    },
    setup: (ctx) => {
      if (setup) setup(ctx);
    },
  };
}

describe("plugin registry", () => {
  it("publishes plugin lifecycle changes", async () => {
    const reg = createPluginRegistry();
    let changes = 0;
    const unsubscribe = reg.onChange(() => changes++);
    reg.register(makePlugin("observable"));
    await reg.activate("observable");
    await reg.dispose("observable");
    unsubscribe();

    expect(changes).toBeGreaterThanOrEqual(3);
    expect(reg.list()).toEqual([]);
  });

  it("observes service registration and removal exactly once", () => {
    const services = createServiceLookup();
    const seen: boolean[] = [];
    const unsubscribe = services.subscribe(() =>
      seen.push(services.has("example")),
    );
    const remove = services.register("example", { value: 1 });

    expect(() => services.register("example", { value: 2 })).toThrow(
      /already registered/,
    );
    remove();
    remove();
    unsubscribe();
    services.register("after-unsubscribe", {});

    expect(seen).toEqual([true, false]);
  });

  it("does not let a stale service handle remove a newer registration", () => {
    const services = createServiceLookup();
    const first = { generation: 1 };
    const second = { generation: 2 };
    const removeFirst = services.register("replaceable", first);
    removeFirst();
    services.register("replaceable", second);

    removeFirst();

    expect(services.get("replaceable")).toBe(second);
  });

  it("registers and unregisters", () => {
    const reg = createPluginRegistry();
    const handle = reg.register(makePlugin("p1"));
    expect(reg.get("p1")).toBeDefined();
    handle.unregister();
    expect(reg.get("p1")).toBeUndefined();
  });

  it("rejects duplicate ids", () => {
    const reg = createPluginRegistry();
    reg.register(makePlugin("dup"));
    expect(() => reg.register(makePlugin("dup"))).toThrow(/already registered/);
  });

  it("auto-activates on-start plugins", async () => {
    const reg = createPluginRegistry();
    reg.register(makePlugin("auto", "on-start"));
    // allow microtask
    await new Promise((r) => setTimeout(r, 10));
    expect(reg.get("auto")?.status).toBe("active");
  });

  it("isolates setup errors", async () => {
    const reg = createPluginRegistry();
    const bad: DevtoolsPlugin = {
      manifest: {
        id: "bad",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "bad",
        targets: ["ui"],
        activation: "on-start",
      },
      setup() {
        throw new Error("boom");
      },
    };
    reg.register(bad);
    await new Promise((r) => setTimeout(r, 10));
    expect(reg.get("bad")?.status).toBe("error");
    // shell still usable: registry still has other plugins
    reg.register(makePlugin("ok"));
    expect(reg.get("ok")).toBeDefined();
  });

  it("dispose cleans up", async () => {
    const reg = createPluginRegistry();
    let cleaned = false;
    const p: DevtoolsPlugin = {
      manifest: {
        id: "clean",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "clean",
        targets: ["ui"],
        activation: "on-demand",
      },
      setup(ctx) {
        const c = ctx as { dispose: (fn: () => void) => void };
        c.dispose(() => {
          cleaned = true;
        });
      },
    };
    reg.register(p);
    await reg.activate("clean");
    await reg.dispose("clean");
    expect(cleaned).toBe(true);
    expect(reg.get("clean")).toBeUndefined();
  });

  it("re-register after dispose works (no leaks)", async () => {
    const reg = createPluginRegistry();
    reg.register(makePlugin("rr"));
    await reg.dispose("rr");
    // re-register same id should succeed
    const h = reg.register(makePlugin("rr"));
    expect(h).toBeDefined();
    expect(reg.get("rr")).toBeDefined();
  });

  it("dynamic activation/deactivation updates panel registry", async () => {
    const reg = createPluginRegistry();
    const p: DevtoolsPlugin = {
      manifest: {
        id: "panelplug",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "panelplug",
        targets: ["ui"],
        activation: "on-demand",
      },
      setup(ctx) {
        const c = ctx as {
          panels: {
            register: (p: {
              id: string;
              title: string;
              load: () => null;
            }) => void;
          };
        };
        c.panels.register({ id: "pp", title: "PP", load: () => null });
      },
    };
    reg.register(p);
    expect(reg.panels.list().length).toBe(0);
    await reg.activate("panelplug");
    expect(reg.panels.list().length).toBe(1);
  });

  it("removes every resource registered through a plugin context on dispose", async () => {
    const reg = createPluginRegistry();
    const plugin = makePlugin("owned", "on-demand", (value) => {
      const ctx = value as PluginContext;
      ctx.panels.register({
        id: "owned.panel",
        title: "Owned",
        load: () => null,
      });
      ctx.inspectors.register({
        id: "owned.inspector",
        tree: () => [],
        getNode: () => undefined,
        getValue: () => undefined,
      });
      ctx.commands.register({
        id: "owned.command",
        title: "Owned",
        safety: "read",
        run: () => undefined,
      });
      ctx.timeline.registerLayer({ id: "owned.timeline", label: "Owned" });
      ctx.settings.register({
        namespace: "owned.settings",
        defaults: { enabled: true },
      });
    });

    reg.register(plugin);
    await reg.activate("owned");
    await reg.dispose("owned");

    expect(reg.panels.list()).toEqual([]);
    expect(reg.inspectors.list()).toEqual([]);
    expect(reg.commands.list()).toEqual([]);
    expect(reg.timeline.listLayers()).toEqual([]);
    expect(reg.settings.list()).toEqual([]);
  });

  it("registers core and optional external services under exact runtime IDs", () => {
    const reactService: RuntimeService<{ roots: string[] }> = {
      getSnapshot: () => ({
        status: "available",
        data: { roots: [] },
        revision: 0,
      }),
      subscribe: () => () => undefined,
    };
    const reg = createPluginRegistry({
      externalServices: [
        { id: RUNTIME_SERVICE_IDS.react, service: reactService },
      ],
    });

    expect(reg.services.get(RUNTIME_SERVICE_IDS.timeline)).toBe(reg.timeline);
    expect(reg.services.get(RUNTIME_SERVICE_IDS.sessions)).toBeDefined();
    expect(reg.services.get(RUNTIME_SERVICE_IDS.network)).toBeDefined();
    expect(reg.services.get(RUNTIME_SERVICE_IDS.stores)).toBeDefined();
    expect(reg.services.get(RUNTIME_SERVICE_IDS.react)).toBe(reactService);
    expect(reg.services.has(RUNTIME_SERVICE_IDS.routes)).toBe(false);
    expect(reg.services.has(RUNTIME_SERVICE_IDS.editor)).toBe(false);
  });

  it("stops and detaches core runtime services when the registry is disposed", async () => {
    let disconnected = 0;
    const runtimeServices = createCoreRuntimeServices({
      network: {
        performanceObserverFactory: () => ({
          observe: () => undefined,
          disconnect: () => {
            disconnected++;
          },
        }),
      },
    });
    runtimeServices.network.start();
    let timelineNotifications = 0;
    runtimeServices.timeline.subscribe(() => timelineNotifications++);
    const reg = createPluginRegistry({ runtimeServices });

    await reg.disposeAll();
    runtimeServices.timeline.startRecording();

    expect(disconnected).toBe(1);
    expect(timelineNotifications).toBe(0);
    expect(reg.services.has(RUNTIME_SERVICE_IDS.timeline)).toBe(false);
  });

  it("suspends and re-activates a plugin", async () => {
    const reg = createPluginRegistry();
    let setupCount = 0;
    reg.register(
      makePlugin("toggler", "on-start", (value) => {
        setupCount++;
        const ctx = value as PluginContext;
        ctx.panels.register({
          id: "toggler.panel",
          title: "Toggler",
          load: () => null,
        });
      }),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(reg.get("toggler")?.status).toBe("active");
    expect(reg.panels.list()).toHaveLength(1);
    await reg.suspend("toggler");
    expect(reg.get("toggler")?.status).toBe("suspended");
    expect(reg.panels.list()).toEqual([]);
    await reg.activate("toggler");
    expect(reg.get("toggler")?.status).toBe("active");
    expect(setupCount).toBe(2);
    expect(reg.panels.list()).toHaveLength(1);
  });

  it("activates on-capability plugins when the capability becomes available", async () => {
    const reg = createPluginRegistry();
    const p: DevtoolsPlugin = {
      manifest: {
        id: "capplug",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "capplug",
        targets: ["ui"],
        activation: "on-capability",
        requiredCapabilities: ["cap.x"],
      },
      setup() {
        /* noop */
      },
    };
    reg.register(p);
    await new Promise((r) => setTimeout(r, 10));
    expect(reg.get("capplug")?.status).toBe("registered");
    reg.capabilities.provide({
      id: "cap.x",
      availability: "available",
      source: "static",
      permission: "read",
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(reg.get("capplug")?.status).toBe("active");
  });

  it("marks malformed on-capability plugins as visibly failed", () => {
    const reg = createPluginRegistry();
    reg.register({
      manifest: {
        id: "missing-capability-declaration",
        version: "0.0.1",
        sdkRange: ">=0.0.0",
        displayName: "Missing capability declaration",
        targets: ["ui"],
        activation: "on-capability",
      },
      setup() {},
    });

    expect(reg.get("missing-capability-declaration")?.status).toBe("error");
    expect(reg.get("missing-capability-declaration")?.error?.message).toMatch(
      /requiredCapabilities/,
    );
  });

  it("isolates a throwing inspector registration during activation", async () => {
    const reg = createPluginRegistry();
    const p: DevtoolsPlugin = {
      manifest: {
        id: "thrower",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "thrower",
        targets: ["ui"],
        activation: "on-start",
      },
      setup(ctx) {
        const c = ctx as {
          panels: { register: (p: unknown) => void };
        };
        c.panels.register({ id: "x", title: "X", load: () => null });
        throw new Error("after-register");
      },
    };
    reg.register(p);
    await new Promise((r) => setTimeout(r, 10));
    expect(reg.get("thrower")?.status).toBe("error");
    // Registry remains usable after a failing plugin.
    expect(reg.register(makePlugin("after"))).toBeDefined();
  });

  it("rolls back resources when setup fails after registration", async () => {
    const reg = createPluginRegistry();
    reg.register({
      manifest: {
        id: "partial-failure",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "partial-failure",
        targets: ["ui"],
        activation: "on-demand",
      },
      setup(ctx) {
        ctx.panels.register({
          id: "leaked-panel",
          title: "Leaked",
          load: () => null,
        });
        throw new Error("setup failed");
      },
    });

    await reg.activate("partial-failure");

    expect(reg.get("partial-failure")?.status).toBe("error");
    expect(reg.panels.list()).toEqual([]);
  });

  it("removes resources registered after disposal by an in-flight setup", async () => {
    let resumeSetup!: () => void;
    const setupGate = new Promise<void>((resolve) => {
      resumeSetup = resolve;
    });
    let cleanupCalls = 0;
    let explicitDisposerCalls = 0;
    const reg = createPluginRegistry();
    reg.register({
      manifest: {
        id: "slow",
        version: "0.0.1",
        sdkRange: ">=0",
        displayName: "slow",
        targets: ["ui"],
        activation: "on-demand",
      },
      async setup(ctx) {
        await setupGate;
        ctx.panels.register({ id: "late", title: "Late", load: () => null });
        ctx.dispose(() => {
          explicitDisposerCalls++;
        });
        return () => {
          cleanupCalls++;
        };
      },
    });
    const activation = reg.activate("slow");
    await Promise.resolve();

    await reg.dispose("slow");
    resumeSetup();
    await activation;

    expect(reg.panels.list()).toEqual([]);
    expect(cleanupCalls).toBe(1);
    expect(explicitDisposerCalls).toBe(1);
    expect(reg.get("slow")).toBeUndefined();
  });
});
