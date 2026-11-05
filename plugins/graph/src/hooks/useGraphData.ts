import type {
	RuntimeServiceSnapshot,
	RuntimeServiceStatus,
} from "@next-devtools/contracts";
import type {
	ComponentDependencies,
	DependencyEdgeKind,
	DependencyNodeKind,
	ReactRuntimeService,
	ReactRuntimeSnapshot,
} from "@next-devtools/runtime-react";
import * as React from "react";
import type { GraphView, GraphViewStatus } from "../lib/graph-model.js";
import {
	buildGraphView,
	computeRequiredComponents,
} from "../lib/graph-transform.js";

const UNAVAILABLE_SNAPSHOT: RuntimeServiceSnapshot<ReactRuntimeSnapshot> = {
	status: "unavailable",
	data: {
		capabilities: {
			tree: false,
			props: false,
			hooks: false,
			source: false,
			profiler: false,
			selection: false,
			dependencies: false,
		},
		roots: [],
		tree: [],
	},
	reason: "React runtime service is not registered.",
	revision: 0,
};

const COMMIT_REFRESH_INTERVAL_MS = 650;

export interface UseGraphDataInput {
	readonly service: ReactRuntimeService | undefined;
	readonly depth: number;
	readonly nodeLimit: number;
	readonly nodeKinds: ReadonlySet<DependencyNodeKind>;
	readonly edgeKinds: ReadonlySet<DependencyEdgeKind>;
	readonly query: string;
	readonly selectedNodeId?: string;
}

export interface GraphDataResult {
	readonly snapshot: RuntimeServiceSnapshot<ReactRuntimeSnapshot>;
	readonly runtimeStatus: RuntimeServiceStatus;
	readonly rootComponentId: string | null;
	readonly externalSelectedComponentId: string | null;
	readonly dependencySets: ReadonlyMap<string, ComponentDependencies>;
	readonly loaded: boolean;
	readonly loading: boolean;
	readonly dependencyError?: string;
	readonly dependenciesCapable: boolean;
	readonly view: GraphView;
	readonly focusComponent: (id: string) => void;
	readonly selectInComponents: (id: string) => void;
	readonly reload: () => void;
	readonly canReload: boolean;
}

interface RootState {
	readonly root: string | null;
	readonly external: string | null;
}

/**
 * Subscribes to the React runtime and loads evidence-backed dependency sets for
 * the selected component and, when requested, verified provider components.
 *
 * Every request is tagged with the root generation token, so a late response
 * from a previous selection can never attach to the new graph.
 */
export function useGraphData(input: UseGraphDataInput): GraphDataResult {
	const { service, depth, nodeLimit, nodeKinds, edgeKinds, query } = input;

	const subscribe = React.useMemo(
		() =>
			(listener: () => void): (() => void) =>
				service?.subscribe(listener) ?? (() => undefined),
		[service],
	);
	const getSnapshot = React.useMemo(
		() => () => service?.getSnapshot() ?? UNAVAILABLE_SNAPSHOT,
		[service],
	);
	const snapshot = React.useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot,
	);

	const externalSelected = snapshot.data.selectedComponentId ?? null;

	const [rootState, setRootState] = React.useState<RootState>(() => ({
		root: externalSelected,
		external: externalSelected,
	}));
	if (rootState.external !== externalSelected) {
		// Components tab selection changed: the graph follows it synchronously.
		setRootState({ root: externalSelected, external: externalSelected });
	}
	const rootComponentId =
		rootState.external === externalSelected ? rootState.root : externalSelected;

	const [sets, setSets] = React.useState<
		ReadonlyMap<string, ComponentDependencies>
	>(() => new Map());
	const [dependencyError, setDependencyError] = React.useState<
		string | undefined
	>(undefined);
	const [, setReloadNonce] = React.useState(0);

	const tokenRef = React.useRef(0);
	const pendingRef = React.useRef(new Set<string>());
	const failedRef = React.useRef(new Map<string, string>());

	// A new root invalidates every in-flight extraction and any provider cache.
	React.useEffect(() => {
		tokenRef.current += 1;
		pendingRef.current.clear();
		failedRef.current.clear();
		setSets(new Map());
		setDependencyError(undefined);
	}, [rootComponentId]);

	const snapshotStatus = snapshot.status;
	const dependenciesCapable = snapshot.data.capabilities.dependencies !== false;
	const serviceAvailable = service !== undefined;

	const shouldRead =
		serviceAvailable &&
		rootComponentId !== null &&
		snapshotStatus !== "unavailable" &&
		dependenciesCapable;

	React.useEffect(() => {
		if (!service || !rootComponentId || !shouldRead) return;
		const token = tokenRef.current;
		const required = computeRequiredComponents(rootComponentId, sets, depth);

		for (const id of required) {
			if (pendingRef.current.has(id) || failedRef.current.has(id)) continue;
			pendingRef.current.add(id);
			void service
				.readDependencies(id)
				.then((result) => {
					if (tokenRef.current !== token) return;
					pendingRef.current.delete(id);
					if (!result) {
						failedRef.current.set(
							id,
							"Dependency extraction returned no data.",
						);
						if (id === rootComponentId) {
							setDependencyError(
								"The React adapter returned no dependency data for the selected component.",
							);
						}
						return;
					}
					setSets((previous) => {
						if (previous.has(id)) return previous;
						const next = new Map(previous);
						next.set(id, result);
						return next;
					});
				})
				.catch((error: unknown) => {
					if (tokenRef.current !== token) return;
					pendingRef.current.delete(id);
					const message =
						error instanceof Error ? error.message : String(error);
					failedRef.current.set(id, message);
					if (id === rootComponentId) setDependencyError(message);
				});
		}
	}, [service, rootComponentId, sets, depth, shouldRead]);

	// Keep the focused component's values fresh as the inspected app commits.
	const firstRootId = snapshot.data.roots[0];
	React.useEffect(() => {
		if (!service || !rootComponentId || !shouldRead) return;
		if (!firstRootId) return;
		let lastRefresh = 0;
		return service.subscribeToCommits((event) => {
			if (event.rootId && event.rootId !== firstRootId) return;
			const now = Date.now();
			if (now - lastRefresh < COMMIT_REFRESH_INTERVAL_MS) return;
			lastRefresh = now;
			const token = tokenRef.current;
			const target = rootComponentId;
			void service.readDependencies(target).then((result) => {
				if (!result || tokenRef.current !== token) return;
				setSets((previous) => {
					const next = new Map(previous);
					next.set(target, result);
					return next;
				});
			});
		});
	}, [service, rootComponentId, shouldRead, firstRootId]);

	const loaded = rootComponentId !== null && sets.has(rootComponentId);
	const loading =
		shouldRead && rootComponentId !== null && !loaded && !dependencyError;

	const forcedStatus: GraphViewStatus | undefined = !serviceAvailable
		? "unavailable"
		: snapshotStatus === "error"
			? "error"
			: snapshotStatus === "unavailable"
				? "unavailable"
				: !dependenciesCapable
					? "unsupported"
					: rootComponentId === null
						? "empty"
						: undefined;

	const reason = !serviceAvailable
		? UNAVAILABLE_SNAPSHOT.reason
		: (snapshot.reason ??
			(rootComponentId === null
				? "Select a component in the Components tab to inspect its reactive dependencies."
				: undefined));

	const view = React.useMemo(
		() =>
			buildGraphView({
				...(rootComponentId ? { rootComponentId } : {}),
				sets,
				depth,
				nodeKinds,
				edgeKinds,
				query,
				nodeLimit,
				...(input.selectedNodeId
					? { selectedNodeId: input.selectedNodeId }
					: {}),
				...(forcedStatus ? { status: forcedStatus } : {}),
				...(reason ? { reason } : {}),
			}),
		[
			rootComponentId,
			sets,
			depth,
			nodeKinds,
			edgeKinds,
			query,
			nodeLimit,
			input.selectedNodeId,
			forcedStatus,
			reason,
		],
	);

	const focusComponent = React.useCallback(
		(id: string) => {
			setRootState({ root: id, external: id });
			service?.selectComponent(id);
		},
		[service],
	);

	const selectInComponents = React.useCallback(
		(id: string) => {
			service?.selectComponent(id);
		},
		[service],
	);

	const reload = React.useCallback(() => {
		tokenRef.current += 1;
		pendingRef.current.clear();
		failedRef.current.clear();
		setSets(new Map());
		setDependencyError(undefined);
		setReloadNonce((value) => value + 1);
	}, []);

	return {
		snapshot,
		runtimeStatus: snapshotStatus,
		rootComponentId,
		externalSelectedComponentId: externalSelected,
		dependencySets: sets,
		loaded,
		loading,
		...(dependencyError ? { dependencyError } : {}),
		dependenciesCapable,
		view,
		focusComponent,
		selectInComponents,
		reload,
		canReload: serviceAvailable && rootComponentId !== null,
	};
}
