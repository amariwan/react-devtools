import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import {
  createZustandAdapter,
  type ZustandStoreEntry,
} from "./zustand-adapter.js";

export const zustandPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.state.zustand",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Zustand",
    targets: ["browser", "ui"],
    activation: "on-start",
    permissions: ["read-state"],
  },
  setup(ctx) {
    const stores = ctx.services.get<StoreAdapterRegistry>(
      RUNTIME_SERVICE_IDS.stores,
    );
    if (
      stores &&
      ctx.permissions.check("read-state") &&
      typeof window !== "undefined"
    ) {
      const entries = (window as unknown as { __ZUSTAND_STORES__?: unknown[] })
        .__ZUSTAND_STORES__;
      for (const [index, value] of (entries ?? []).entries()) {
        if (!value || typeof value !== "object") continue;
        const adapter = createZustandAdapter(value as ZustandStoreEntry, index);
        if (adapter) {
          const registration = stores.register(adapter);
          ctx.dispose(registration.unregister);
        }
      }
    }
    ctx.panels.register({
      id: "zustand",
      title: "Zustand",
      icon: "store",
      order: 10,
      load: async () => {
        const { default: Panel } = await import("./ZustandPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default zustandPlugin;
