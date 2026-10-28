import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import { createQueryAdapter, type QueryClientLike } from "./query-adapter.js";

export const tanstackQueryPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.state.tanstack-query",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "TanStack Query",
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
      const globalWindow = window as unknown as Record<string, unknown>;
      const client =
        globalWindow.__TANSTACK_QUERY_CLIENT__ ??
        globalWindow.__REACT_QUERY_CLIENT__;
      if (client && typeof client === "object") {
        const adapter = createQueryAdapter(client as QueryClientLike);
        if (adapter) {
          const registration = stores.register(adapter);
          ctx.dispose(registration.unregister);
        }
      }
    }
    ctx.panels.register({
      id: "tanstack-query",
      title: "TanStack Query",
      icon: "store",
      order: 12,
      load: async () => {
        const { default: Panel } = await import("./TanStackQueryPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default tanstackQueryPlugin;
