import type { TypedEventBus } from "@next-devtools/plugin-sdk";

export function createEventBus(): TypedEventBus {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();

  return {
    emit<T = unknown>(event: string, payload: T) {
      const set = listeners.get(event);
      if (!set) return;
      for (const l of set) {
        try {
          l(payload);
        } catch {
          // isolate listener errors
        }
      }
    },
    on<T = unknown>(event: string, listener: (payload: T) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      const set = listeners.get(event)!;
      const wrapped = listener as (payload: unknown) => void;
      set.add(wrapped);
      return () => set.delete(wrapped);
    },
    off(event, listener) {
      const set = listeners.get(event);
      if (set) set.delete(listener as (payload: unknown) => void);
    },
  };
}
