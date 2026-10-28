import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";
import {
  RUNTIME_SERVICE_IDS,
  type RuntimeService,
  type RuntimeServiceId,
} from "@next-devtools/contracts";
import type {
  PluginContext,
  PanelRegistry,
  InspectorRegistry,
  CommandRegistry,
  SettingsRegistry,
} from "@next-devtools/plugin-sdk";
import { createCapabilityRegistry } from "./capability-registry.js";
import { createEventBus } from "./event-bus.js";
import { createStateStore } from "./state-store.js";
import { createServiceLookup } from "./service-lookup.js";
import { createPermissionClient } from "./permission-client.js";
import type { TimelineRuntime } from "./timeline-runtime.js";
import {
  createCoreRuntimeServices,
  type CoreRuntimeServices,
} from "./runtime-services.js";

export type PluginStatus =
  "registered" | "active" | "suspended" | "disposed" | "error";

export type RegisteredPlugin = {
  plugin: DevtoolsPlugin;
  status: PluginStatus;
  error?: Error;
  disposers: Array<() => void>;
  cleanup?: (() => void | void | Promise<void | void>) | undefined;
};

export type PluginRegistry = {
  register(plugin: DevtoolsPlugin): {
    unregister: () => void;
    status: () => PluginStatus;
  };
  unregister(id: string): boolean;
  get(id: string): RegisteredPlugin | undefined;
  list(): RegisteredPlugin[];
  onChange(listener: () => void): () => void;
  activate(id: string): Promise<void>;
  suspend(id: string): Promise<void>;
  dispose(id: string): Promise<void>;
  disposeAll(): Promise<void>;
  // registries exposed to plugins
  panels: PanelRegistry;
  inspectors: InspectorRegistry;
  timeline: TimelineRuntime;
  commands: CommandRegistry;
  settings: SettingsRegistry;
  capabilities: ReturnType<typeof createCapabilityRegistry>;
  events: ReturnType<typeof createEventBus>;
  services: ReturnType<typeof createServiceLookup>;
  permissions: ReturnType<typeof createPermissionClient>;
};

function createPanelRegistry(): PanelRegistry {
  type Panel = import("@next-devtools/plugin-sdk").PanelDescriptor;
  const panels = new Map<string, { readonly value: Panel }>();
  const listeners = new Set<
    (panels: import("@next-devtools/plugin-sdk").PanelDescriptor[]) => void
  >();
  function notify() {
    const list = Array.from(panels.values(), ({ value }) => value).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    for (const l of listeners) l(list);
  }
  return {
    register(panel) {
      const registration = { value: panel };
      panels.set(panel.id, registration);
      notify();
      return {
        unregister: () => {
          if (panels.get(panel.id) !== registration) return;
          panels.delete(panel.id);
          notify();
        },
      };
    },
    list() {
      return Array.from(panels.values(), ({ value }) => value);
    },
    onChange(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

function createInspectorRegistry(): InspectorRegistry {
  type Inspector = Parameters<InspectorRegistry["register"]>[0];
  const inspectors = new Map<string, { readonly value: Inspector }>();
  return {
    register(inspector: Parameters<InspectorRegistry["register"]>[0]) {
      const registration = { value: inspector };
      inspectors.set(inspector.id, registration);
      return {
        unregister: () => {
          if (inspectors.get(inspector.id) !== registration) return;
          inspectors.delete(inspector.id);
        },
      };
    },
    list() {
      return Array.from(inspectors.keys());
    },
  };
}

function createCommandRegistry(): CommandRegistry {
  type Command = import("@next-devtools/plugin-sdk").CommandDescriptor;
  const commands = new Map<string, { readonly value: Command }>();
  return {
    register(command: import("@next-devtools/plugin-sdk").CommandDescriptor) {
      const registration = { value: command };
      commands.set(command.id, registration);
      return {
        unregister: () => {
          if (commands.get(command.id) !== registration) return;
          commands.delete(command.id);
        },
      };
    },
    list() {
      return Array.from(commands.values(), ({ value }) => value);
    },
  };
}

function createSettingsRegistry(): SettingsRegistry {
  type Schema = import("@next-devtools/plugin-sdk").SettingsSchema;
  const schemas = new Map<string, { readonly value: Schema }>();
  const values = new Map<string, Record<string, unknown>>();
  return {
    register(schema: import("@next-devtools/plugin-sdk").SettingsSchema) {
      const registration = { value: schema };
      schemas.set(schema.namespace, registration);
      if (!values.has(schema.namespace))
        values.set(schema.namespace, { ...schema.defaults });
      return {
        unregister: () => {
          if (schemas.get(schema.namespace) !== registration) return;
          schemas.delete(schema.namespace);
          values.delete(schema.namespace);
        },
      };
    },
    get(ns: string) {
      return values.get(ns) ?? {};
    },
    set(ns: string, v: Record<string, unknown>) {
      values.set(ns, { ...v });
    },
    list() {
      return Array.from(schemas.keys());
    },
  };
}

export function createPluginRegistry(options?: {
  permissions?: string[];
  runtimeServices?: CoreRuntimeServices;
  externalServices?: ReadonlyArray<{
    id: RuntimeServiceId;
    service: RuntimeService<unknown>;
  }>;
}): PluginRegistry {
  const plugins = new Map<string, RegisteredPlugin>();
  const runtimeServices =
    options?.runtimeServices ?? createCoreRuntimeServices();
  const panels = createPanelRegistry();
  const inspectors = createInspectorRegistry();
  const timeline = runtimeServices.timeline;
  const commands = createCommandRegistry();
  const settings = createSettingsRegistry();
  const capabilities = createCapabilityRegistry();
  const events = createEventBus();
  const services = createServiceLookup();
  const permissions = createPermissionClient(options?.permissions);
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const serviceDisposers = [
    services.register(RUNTIME_SERVICE_IDS.timeline, runtimeServices.timeline),
    services.register(RUNTIME_SERVICE_IDS.sessions, runtimeServices.sessions),
    services.register(RUNTIME_SERVICE_IDS.network, runtimeServices.network),
    services.register(RUNTIME_SERVICE_IDS.stores, runtimeServices.stores),
    services.register(
      RUNTIME_SERVICE_IDS.diagnostics,
      runtimeServices.diagnostics,
    ),
  ];
  for (const entry of options?.externalServices ?? []) {
    serviceDisposers.push(services.register(entry.id, entry.service));
  }
  let registryDisposed = false;

  async function disposePluginResources(rp: RegisteredPlugin): Promise<void> {
    const cleanup = rp.cleanup;
    rp.cleanup = undefined;
    try {
      if (cleanup) await cleanup();
    } catch {
      /* isolate plugin cleanup */
    }
    for (const dispose of rp.disposers.reverse()) {
      try {
        dispose();
      } catch {
        /* isolate plugin resource cleanup */
      }
    }
    rp.disposers = [];
  }

  function buildContext(
    plugin: DevtoolsPlugin,
    rp: RegisteredPlugin,
  ): PluginContext {
    const own = <T extends { unregister: () => void }>(registration: T): T => {
      if (rp.status === "disposed") {
        registration.unregister();
        return registration;
      }
      rp.disposers.push(registration.unregister);
      return registration;
    };
    const ctx: PluginContext = {
      capabilities,
      inspectors: {
        ...inspectors,
        register: (inspector) => own(inspectors.register(inspector)),
      },
      panels: {
        ...panels,
        register: (panel) => own(panels.register(panel)),
      },
      commands: {
        ...commands,
        register: (command) => own(commands.register(command)),
      },
      timeline: {
        ...timeline,
        registerLayer: (layer) => own(timeline.registerLayer(layer)),
      },
      settings: {
        ...settings,
        register: (schema) => own(settings.register(schema)),
      },
      state: createStateStore().namespace(plugin.manifest.id),
      events,
      services,
      permissions,
      dispose(d) {
        if (rp.status === "disposed") {
          try {
            d();
          } catch {
            /* isolate late plugin cleanup */
          }
          return;
        }
        rp.disposers.push(d);
      },
    };
    return ctx;
  }

  async function activatePlugin(rp: RegisteredPlugin) {
    if (rp.status === "active" || rp.status === "disposed") return;
    const pluginId = rp.plugin.manifest.id;
    try {
      const ctx = buildContext(rp.plugin, rp);
      const result = await rp.plugin.setup(ctx);
      if (plugins.get(pluginId) !== rp) {
        if (typeof result === "function") await result();
        return;
      }
      if (typeof result === "function") {
        rp.cleanup = result as () => void | Promise<void>;
      }
      rp.status = "active";
      notify();
    } catch (err) {
      if (plugins.get(pluginId) !== rp) return;
      // Setup may have registered resources before throwing. Roll them back so
      // a failed plugin cannot leave stale UI, commands, or subscriptions.
      void disposePluginResources(rp);
      rp.status = "error";
      rp.error = err instanceof Error ? err : new Error(String(err));
      notify();
    }
  }

  const registry: PluginRegistry = {
    panels,
    inspectors,
    timeline,
    commands,
    settings,
    capabilities,
    events,
    services,
    permissions,

    register(plugin) {
      const id = plugin.manifest.id;
      if (plugins.has(id)) {
        throw new Error(`Plugin already registered: ${id}`);
      }
      const rp: RegisteredPlugin = {
        plugin,
        status: "registered",
        disposers: [],
      };
      plugins.set(id, rp);
      notify();

      // auto-activate on-start
      if (plugin.manifest.activation === "on-start") {
        void activatePlugin(rp);
      } else if (plugin.manifest.activation === "on-capability") {
        const requiredCapabilities = plugin.manifest.requiredCapabilities;
        if (!requiredCapabilities?.length) {
          rp.status = "error";
          rp.error = new Error(
            "on-capability plugins must declare requiredCapabilities",
          );
          notify();
        } else {
          // activate when all required capabilities available
          const tryActivate = () => {
            const ok = requiredCapabilities.every((c) => capabilities.has(c));
            if (ok) {
              void activatePlugin(rp);
              unsub();
            }
          };
          const unsub = capabilities.onChange(tryActivate);
          tryActivate();
          rp.disposers.push(unsub);
        }
      }
      // on-demand: stays registered until explicitly activated

      return {
        unregister: () => {
          registry.unregister(id);
        },
        status: () => rp.status,
      };
    },

    unregister(id) {
      const rp = plugins.get(id);
      if (!rp) return false;
      void registry.dispose(id);
      return true;
    },

    get(id) {
      return plugins.get(id);
    },
    list() {
      return Array.from(plugins.values());
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async activate(id) {
      const rp = plugins.get(id);
      if (!rp) throw new Error(`Unknown plugin: ${id}`);
      await activatePlugin(rp);
    },

    async suspend(id) {
      const rp = plugins.get(id);
      if (!rp || rp.status !== "active") return;
      rp.status = "suspended";
      await disposePluginResources(rp);
      notify();
    },

    async dispose(id) {
      const rp = plugins.get(id);
      if (!rp) return;
      rp.status = "disposed";
      plugins.delete(id);
      await disposePluginResources(rp);
      notify();
    },

    async disposeAll() {
      for (const id of Array.from(plugins.keys())) {
        await registry.dispose(id);
      }
      if (registryDisposed) return;
      registryDisposed = true;
      for (const dispose of [...serviceDisposers].reverse()) dispose();
      runtimeServices.dispose();
      services.dispose();
      listeners.clear();
    },
  };

  return registry;
}
