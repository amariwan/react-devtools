import type {
  CapabilityRegistry,
  RuntimeServiceId,
} from "@next-devtools/contracts";

export interface PanelDescriptor {
  id: string;
  title: string;
  icon?: string;
  order?: number;
  load: () => Promise<unknown> | unknown;
  when?: () => boolean;
}

export interface PanelRegistry {
  register(panel: PanelDescriptor): { unregister: () => void };
  list(): PanelDescriptor[];
  onChange(listener: (panels: PanelDescriptor[]) => void): () => void;
}

export interface InspectorNode {
  id: string;
  label: string;
  hasChildren?: boolean;
}

export interface InspectorRegistry {
  register(inspector: {
    id: string;
    tree: (
      parentId: string | null,
    ) => InspectorNode[] | Promise<InspectorNode[]>;
    getNode: (id: string) => unknown | Promise<unknown>;
    getValue: (path: string) => unknown | Promise<unknown>;
    edit?: (path: string, value: unknown) => void | Promise<void>;
  }): { unregister: () => void };
  list(): string[];
}

export interface TimelineLayer {
  id: string;
  label: string;
  filter?: (event: unknown) => boolean;
  schema?: Record<string, unknown>;
}

export interface TimelineRegistry {
  registerLayer(layer: TimelineLayer): { unregister: () => void };
  emit(event: {
    layer: string;
    type: string;
    payload: unknown;
    timestampUnixMs?: number;
  }): void;
  listLayers(): TimelineLayer[];
}

export interface CommandDescriptor {
  id: string;
  title: string;
  keybinding?: string;
  when?: () => boolean;
  safety: "read" | "action" | "destructive";
  run: () => void | Promise<void>;
}

export interface CommandRegistry {
  register(command: CommandDescriptor): { unregister: () => void };
  list(): CommandDescriptor[];
}

export interface SettingsSchema {
  namespace: string;
  defaults: Record<string, unknown>;
  migrations?: Array<
    (prev: Record<string, unknown>) => Record<string, unknown>
  >;
}

export interface SettingsRegistry {
  register(schema: SettingsSchema): { unregister: () => void };
  get(namespace: string): Record<string, unknown>;
  set(namespace: string, values: Record<string, unknown>): void;
  list(): string[];
}

export interface PluginStateStore {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): void;
  delete(key: string): void;
  namespace(ns: string): PluginStateStore;
}

export interface TypedEventBus {
  emit<T = unknown>(event: string, payload: T): void;
  on<T = unknown>(event: string, listener: (payload: T) => void): () => void;
  off(event: string, listener: (...args: unknown[]) => void): void;
}

export interface ServiceLookup {
  get<T = unknown>(id: RuntimeServiceId | (string & {})): T | undefined;
  has(id: RuntimeServiceId | (string & {})): boolean;
  subscribe(listener: () => void): () => void;
}

export interface PermissionClient {
  check(permission: string): boolean;
  request(permission: string): Promise<boolean>;
}

export interface PluginContext {
  capabilities: CapabilityRegistry;
  inspectors: InspectorRegistry;
  panels: PanelRegistry;
  commands: CommandRegistry;
  timeline: TimelineRegistry;
  settings: SettingsRegistry;
  state: PluginStateStore;
  events: TypedEventBus;
  services: ServiceLookup;
  permissions: PermissionClient;
  dispose(disposer: () => void): void;
}
