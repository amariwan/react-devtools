import type { PermissionClient } from "@next-devtools/plugin-sdk";

export function createPermissionClient(
  granted: string[] = ["read-state"],
): PermissionClient {
  const set = new Set(granted);
  return {
    check(permission: string) {
      return set.has(permission);
    },
    async request(permission: string) {
      // default: no automatic grant; read-only by default
      if (set.has(permission)) return true;
      return false;
    },
  };
}
