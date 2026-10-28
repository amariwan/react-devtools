import type { RuntimeServiceId } from "@next-devtools/contracts";
import type { ServiceLookup } from "@next-devtools/plugin-sdk";

export interface ServiceRegistry extends ServiceLookup {
  register<T>(id: RuntimeServiceId | (string & {}), service: T): () => void;
  dispose(): void;
}

export function createServiceLookup(): ServiceRegistry {
  const services = new Map<string, { readonly value: unknown }>();
  const listeners = new Set<() => void>();
  let disposed = false;

  function notify() {
    for (const listener of listeners) listener();
  }

  return {
    get<T = unknown>(id: string) {
      return services.get(id)?.value as T | undefined;
    },
    has(id: string) {
      return services.has(id);
    },
    subscribe(listener) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    register<T>(id: string, service: T) {
      if (disposed) throw new Error("Service registry is disposed");
      if (services.has(id)) {
        throw new Error(`Service already registered: ${id}`);
      }
      const registration = { value: service };
      services.set(id, registration);
      notify();
      return () => {
        if (services.get(id) !== registration) return;
        services.delete(id);
        notify();
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      services.clear();
      listeners.clear();
    },
  };
}
