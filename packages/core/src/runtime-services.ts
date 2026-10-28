import {
  createNetworkRuntimeService,
  type NetworkRuntimeService,
} from "./network-runtime.js";
import {
  createSessionRegistry,
  type SessionRegistry,
} from "./session-registry.js";
import {
  createStoreAdapterRegistry,
  type StoreAdapterRegistryOptions,
  type StoreAdapterRegistry,
} from "./store-adapter-registry.js";
import {
  createTimelineRuntime,
  type TimelineRuntime,
} from "./timeline-runtime.js";
import {
  createDiagnosticsRuntime,
  type DiagnosticsRuntime,
} from "./diagnostics-runtime.js";

export interface CoreRuntimeServices {
  readonly timeline: TimelineRuntime;
  readonly sessions: SessionRegistry;
  readonly network: NetworkRuntimeService;
  readonly stores: StoreAdapterRegistry;
  readonly diagnostics: DiagnosticsRuntime;
  dispose(): void;
}

export function createCoreRuntimeServices(options?: {
  timeline?: NonNullable<Parameters<typeof createTimelineRuntime>[0]>;
  sessions?: NonNullable<Parameters<typeof createSessionRegistry>[0]>;
  network?: NonNullable<Parameters<typeof createNetworkRuntimeService>[0]>;
  stores?: StoreAdapterRegistryOptions;
}): CoreRuntimeServices {
  const timeline = createTimelineRuntime(options?.timeline);
  const sessions = createSessionRegistry(options?.sessions);
  const network = createNetworkRuntimeService(options?.network);
  const stores = createStoreAdapterRegistry(options?.stores);
  const diagnostics = createDiagnosticsRuntime();
  let disposed = false;

  return {
    timeline,
    sessions,
    network,
    stores,
    diagnostics,
    dispose() {
      if (disposed) return;
      disposed = true;
      stores.dispose();
      diagnostics.dispose();
      network.dispose();
      sessions.dispose();
      timeline.dispose();
    },
  };
}
