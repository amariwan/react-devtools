import {
	type DiagnosticsRuntime,
	createDiagnosticsRuntime,
} from "./diagnostics-runtime.js";
import {
	type NetworkRuntimeService,
	createNetworkRuntimeService,
} from "./network-runtime.js";
import {
	type SessionRegistry,
	createSessionRegistry,
} from "./session-registry.js";
import {
	type StoreAdapterRegistry,
	type StoreAdapterRegistryOptions,
	createStoreAdapterRegistry,
} from "./store-adapter-registry.js";
import {
	type TimelineRuntime,
	createTimelineRuntime,
} from "./timeline-runtime.js";

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
