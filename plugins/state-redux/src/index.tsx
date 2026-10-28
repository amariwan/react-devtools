import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import { createReduxAdapter, type ReduxStoreLike } from "./redux-adapter.js";

export const reduxPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.state.redux",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Redux",
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
      const store = (window as unknown as { __REDUX_STORE__?: unknown })
        .__REDUX_STORE__;
      if (store && typeof store === "object") {
        const adapter = createReduxAdapter(store as ReduxStoreLike);
        if (adapter) {
          const registration = stores.register(adapter);
          ctx.dispose(registration.unregister);
        }
      }
    }
    ctx.panels.register({
      id: "redux",
      title: "Redux",
      icon: "store",
      order: 11,
      load: async () => {
        const { default: Panel } = await import("./ReduxPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default reduxPlugin;
