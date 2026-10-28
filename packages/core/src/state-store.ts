import type { PluginStateStore } from "@next-devtools/plugin-sdk";

export function createStateStore(): PluginStateStore {
  const data = new Map<string, unknown>();

  function makeStore(prefix: string): PluginStateStore {
    return {
      get<T = unknown>(key: string) {
        return data.get(`${prefix}${key}`) as T | undefined;
      },
      set<T = unknown>(key: string, value: T) {
        data.set(`${prefix}${key}`, value);
      },
      delete(key: string) {
        data.delete(`${prefix}${key}`);
      },
      namespace(ns: string) {
        return makeStore(`${prefix}${ns}:`);
      },
    };
  }

  return makeStore("");
}
