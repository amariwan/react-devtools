import {
  encodeValue,
  type EncodedValue,
  type RuntimeService,
  type RuntimeServiceSnapshot,
  type RuntimeServiceStatus,
} from "@next-devtools/contracts";

export type StoreMutationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code:
        "no-selection" | "unsupported" | "invalid" | "adapter-error";
      readonly reason: string;
    };

export interface StoreAdapter {
  readonly id: string;
  readonly label: string;
  readonly canMutate?: boolean;
  read(): unknown | Promise<unknown>;
  subscribe(listener: () => void): () => void;
  mutate?(
    path: readonly (string | number)[],
    value: unknown,
  ): StoreMutationResult | Promise<StoreMutationResult>;
}

export interface StoreAdapterDescriptor {
  readonly id: string;
  readonly label: string;
  readonly canMutate: boolean;
}

export interface StoreSnapshot {
  readonly adapters: readonly StoreAdapterDescriptor[];
  readonly selectedAdapterId?: string;
  readonly canMutate: boolean;
  readonly loading: boolean;
  readonly value?: EncodedValue;
}

export interface StoreAdapterRegistry extends RuntimeService<StoreSnapshot> {
  register(adapter: StoreAdapter): { unregister(): void };
  list(): StoreAdapterDescriptor[];
  select(id: string): Promise<boolean>;
  refresh(): Promise<void>;
  mutate(
    path: readonly (string | number)[],
    value: unknown,
  ): Promise<StoreMutationResult>;
  dispose(): void;
}

type Registration = {
  readonly adapter: StoreAdapter;
  unsubscribe: () => void;
};

export type StoreAdapterRegistryOptions = {
  /** Mutations require an explicit host-level opt-in. */
  readonly allowMutations?: boolean;
};

export function createStoreAdapterRegistry(
  options: StoreAdapterRegistryOptions = {},
): StoreAdapterRegistry {
  const allowMutations = options.allowMutations === true;
  const registrations = new Map<string, Registration>();
  const listeners = new Set<() => void>();
  let selectedAdapterId: string | undefined;
  let encodedValue: EncodedValue | undefined;
  let loading = false;
  let status: RuntimeServiceStatus = "available";
  let reason: string | undefined;
  let revision = 0;
  let readRevision = 0;
  let disposed = false;
  let snapshot: RuntimeServiceSnapshot<StoreSnapshot> = buildSnapshot();

  function descriptors(): StoreAdapterDescriptor[] {
    return Array.from(registrations.values(), ({ adapter }) => ({
      id: adapter.id,
      label: adapter.label,
      canMutate:
        allowMutations &&
        adapter.canMutate === true &&
        typeof adapter.mutate === "function",
    }));
  }

  function selectedAdapter(): StoreAdapter | undefined {
    return selectedAdapterId
      ? registrations.get(selectedAdapterId)?.adapter
      : undefined;
  }

  function buildSnapshot(): RuntimeServiceSnapshot<StoreSnapshot> {
    const adapter = selectedAdapter();
    return {
      status,
      data: {
        adapters: descriptors(),
        ...(selectedAdapterId ? { selectedAdapterId } : {}),
        canMutate:
          allowMutations &&
          adapter?.canMutate === true &&
          typeof adapter.mutate === "function",
        loading,
        ...(encodedValue !== undefined ? { value: encodedValue } : {}),
      },
      ...(reason ? { reason } : {}),
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  const registry: StoreAdapterRegistry = {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    register(adapter) {
      if (disposed) throw new Error("Store adapter registry is disposed");
      if (registrations.has(adapter.id))
        throw new Error(`Store adapter already registered: ${adapter.id}`);
      const registration: Registration = {
        adapter,
        unsubscribe: () => undefined,
      };
      registrations.set(adapter.id, registration);
      try {
        registration.unsubscribe = adapter.subscribe(() => {
          if (selectedAdapterId === adapter.id) void registry.refresh();
        });
      } catch (error) {
        registrations.delete(adapter.id);
        throw error;
      }
      notify();
      return {
        unregister() {
          if (registrations.get(adapter.id) !== registration) return;
          registrations.delete(adapter.id);
          try {
            registration.unsubscribe();
          } catch {
            /* isolate adapter cleanup */
          }
          if (selectedAdapterId === adapter.id) {
            selectedAdapterId = undefined;
            encodedValue = undefined;
            loading = false;
            status = "available";
            reason = undefined;
            readRevision++;
          }
          notify();
        },
      };
    },
    list() {
      return descriptors();
    },
    async select(id) {
      if (!registrations.has(id) || disposed) return false;
      selectedAdapterId = id;
      encodedValue = undefined;
      status = "available";
      reason = undefined;
      notify();
      await registry.refresh();
      return true;
    },
    async refresh() {
      const adapter = selectedAdapter();
      if (!adapter || disposed) return;
      const currentRead = ++readRevision;
      loading = true;
      notify();
      try {
        const value = await adapter.read();
        if (
          selectedAdapter() !== adapter ||
          currentRead !== readRevision ||
          disposed
        )
          return;
        encodedValue = encodeValue(value);
        loading = false;
        status = "available";
        reason = undefined;
        notify();
      } catch (error) {
        if (
          selectedAdapter() !== adapter ||
          currentRead !== readRevision ||
          disposed
        )
          return;
        loading = false;
        status = "error";
        reason = error instanceof Error ? error.message : String(error);
        notify();
      }
    },
    async mutate(path, value) {
      const adapter = selectedAdapter();
      if (!adapter) {
        return { ok: false, code: "no-selection", reason: "No store selected" };
      }
      if (
        !allowMutations ||
        adapter.canMutate !== true ||
        typeof adapter.mutate !== "function"
      ) {
        return {
          ok: false,
          code: "unsupported",
          reason: "Selected store does not support mutation",
        };
      }
      try {
        const result = await adapter.mutate(path, value);
        if (result.ok) await registry.refresh();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        status = "error";
        reason = message;
        notify();
        return { ok: false, code: "adapter-error", reason: message };
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      readRevision++;
      for (const registration of registrations.values()) {
        try {
          registration.unsubscribe();
        } catch {
          /* isolate adapter cleanup */
        }
      }
      registrations.clear();
      selectedAdapterId = undefined;
      encodedValue = undefined;
      listeners.clear();
    },
  };

  return registry;
}
