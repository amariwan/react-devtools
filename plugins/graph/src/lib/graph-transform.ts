import type {
	ComponentDependencies,
	DependencyEdgeKind,
	DependencyNodeKind,
} from "@next-devtools/runtime-react";
import {
	EDGE_KIND_META,
	type GraphEdgeView,
	type GraphNodeView,
	type GraphView,
	type GraphViewStatus,
	NODE_KIND_META,
	NODE_KIND_ORDER,
	buildEdgeAriaLabel,
	buildNodeAriaLabel,
	buildNodeSearchText,
	formatDependencyArray,
	formatDependencyValue,
} from "./graph-model.js";

export interface BuildGraphViewInput {
	readonly rootComponentId?: string;
	readonly sets: ReadonlyMap<string, ComponentDependencies>;
	readonly depth: number;
	readonly nodeKinds: ReadonlySet<DependencyNodeKind>;
	readonly edgeKinds: ReadonlySet<DependencyEdgeKind>;
	readonly query: string;
	readonly nodeLimit: number;
	readonly selectedNodeId?: string;
	readonly status?: GraphViewStatus;
	readonly reason?: string;
}

interface DepthEntry {
	readonly id: string;
	readonly depth: number;
}

/**
 * Returns the component ids that still need a dependency read for the requested
 * depth. The root is depth 0; its direct dependencies are depth 1. Only
 * component nodes can be expanded because only they map to another fiber.
 */
export function computeRequiredComponents(
	rootComponentId: string | undefined,
	sets: ReadonlyMap<string, ComponentDependencies>,
	depth: number,
): string[] {
	if (!rootComponentId) return [];
	const effectiveDepth = Math.max(1, Math.trunc(depth));
	const required = new Set<string>();
	const visited = new Set<string>();
	const queue: DepthEntry[] = [{ id: rootComponentId, depth: 0 }];

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || visited.has(current.id)) continue;
		visited.add(current.id);

		const set = sets.get(current.id);
		if (!set) {
			if (current.depth < effectiveDepth) required.add(current.id);
			continue;
		}

		for (const node of set.nodes) {
			if (node.kind !== "component") continue;
			if (node.id === current.id || node.id === rootComponentId) continue;
			const nodeDepth = current.depth + 1;
			if (nodeDepth >= effectiveDepth) continue;
			if (visited.has(node.id)) continue;
			if (sets.has(node.id)) {
				queue.push({ id: node.id, depth: nodeDepth });
			} else {
				required.add(node.id);
			}
		}
	}

	return [...required];
}

/**
 * Merges one or more evidence-backed dependency sets into a renderable graph.
 *
 * The transform is pure and deterministic: the same inputs always produce the
 * same ids, ordering, and labels. It never invents nodes or edges.
 */
export function buildGraphView(input: BuildGraphViewInput): GraphView {
	const {
		rootComponentId,
		sets,
		nodeLimit,
		selectedNodeId,
		query,
		nodeKinds,
		edgeKinds,
	} = input;
	const depth = Math.max(1, Math.trunc(input.depth));
	const normalizedQuery = query.trim().toLowerCase();

	if (!rootComponentId) {
		return emptyView({
			status: input.status ?? "empty",
			depth,
			nodeLimit,
			...(input.reason ? { reason: input.reason } : {}),
			limitations: [],
		});
	}

	const rootSet = sets.get(rootComponentId);
	if (!rootSet) {
		return emptyView({
			status: input.status ?? "loading",
			depth,
			nodeLimit,
			rootComponentId,
			...(input.reason ? { reason: input.reason } : {}),
			limitations: [],
		});
	}

	const nodeMap = new Map<string, GraphNodeView>();
	const candidateEdges = new Map<
		string,
		ComponentDependencies["edges"][number]
	>();
	const componentDepth = new Map<string, number>();
	const visitedComponents = new Set<string>();
	const limitations = new Set<string>();
	const queue: DepthEntry[] = [{ id: rootComponentId, depth: 0 }];

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || visitedComponents.has(current.id)) continue;
		visitedComponents.add(current.id);
		componentDepth.set(current.id, current.depth);

		const set = sets.get(current.id);
		if (!set) continue;
		for (const limitation of set.limitations) limitations.add(limitation);

		for (const node of set.nodes) {
			const isSelf = node.id === current.id;
			const nodeDepth = isSelf ? current.depth : current.depth + 1;
			if (nodeDepth > depth) continue;

			const existing = nodeMap.get(node.id);
			if (existing && existing.depth <= nodeDepth) continue;

			const valueLabel = formatDependencyValue(node.value);
			const depsLabel = formatDependencyArray(node.deps);
			const expandable =
				node.kind === "component" && node.id !== rootComponentId;

			const searchText = buildNodeSearchText({
				label: node.label,
				kind: node.kind,
				componentId: node.componentId,
				evidenceSource: node.evidenceSource,
				...(node.note ? { note: node.note } : {}),
				...(node.providerDisplayName
					? { providerDisplayName: node.providerDisplayName }
					: {}),
			});

			nodeMap.set(node.id, {
				id: node.id,
				kind: node.kind,
				label: node.label,
				componentId: node.componentId,
				evidence: node.evidence,
				evidenceSource: node.evidenceSource,
				...(node.note ? { note: node.note } : {}),
				...(node.value !== undefined ? { value: node.value } : {}),
				...(valueLabel ? { valueLabel } : {}),
				...(node.deps !== undefined ? { deps: node.deps } : {}),
				...(depsLabel ? { depsLabel } : {}),
				...(node.hookIndex !== undefined ? { hookIndex: node.hookIndex } : {}),
				...(node.source ? { source: node.source } : {}),
				...(node.providerComponentId
					? { providerComponentId: node.providerComponentId }
					: {}),
				...(node.providerDisplayName
					? { providerDisplayName: node.providerDisplayName }
					: {}),
				depth: nodeDepth,
				root: node.id === rootComponentId,
				expandable,
				searchText,
				matchesQuery: matchesQuery(normalizedQuery, searchText, node.label),
				ariaLabel: buildNodeAriaLabel({
					label: node.label,
					kind: node.kind,
					evidence: node.evidence,
					...(node.note ? { note: node.note } : {}),
				}),
			});

			if (
				node.kind === "component" &&
				node.id !== current.id &&
				node.id !== rootComponentId &&
				nodeDepth < depth &&
				sets.has(node.id) &&
				!visitedComponents.has(node.id)
			) {
				queue.push({ id: node.id, depth: nodeDepth });
			}
		}

		for (const edge of set.edges) {
			candidateEdges.set(edge.id, edge);
		}
	}

	// Category filters. The root always stays visible so the graph keeps context.
	const kindVisible = [...nodeMap.values()].filter(
		(node) => node.root || nodeKinds.has(node.kind),
	);

	// Bounded node limit, lowest graph depth wins so the focused neighborhood
	// is the last thing to be cut.
	kindVisible.sort((a, b) => {
		if (a.root !== b.root) return a.root ? -1 : 1;
		if (a.depth !== b.depth) return a.depth - b.depth;
		const kindDelta =
			NODE_KIND_ORDER.indexOf(a.kind) - NODE_KIND_ORDER.indexOf(b.kind);
		if (kindDelta !== 0) return kindDelta;
		return a.label.localeCompare(b.label);
	});
	const nodeLimitReached = kindVisible.length > nodeLimit;
	const keptNodes = nodeLimitReached
		? kindVisible.slice(0, Math.max(1, nodeLimit))
		: kindVisible;
	const keptNodeIds = new Set(keptNodes.map((node) => node.id));

	const edges: GraphEdgeView[] = [];
	for (const edge of candidateEdges.values()) {
		if (!edgeKinds.has(edge.kind)) continue;
		if (!keptNodeIds.has(edge.source) || !keptNodeIds.has(edge.target))
			continue;
		const sourceNode = nodeMap.get(edge.source);
		const targetNode = nodeMap.get(edge.target);
		if (!sourceNode || !targetNode) continue;
		edges.push({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			kind: edge.kind,
			evidence: edge.evidence,
			evidenceSource: edge.evidenceSource,
			...(edge.note ? { note: edge.note } : {}),
			relationshipLabel: EDGE_KIND_META[edge.kind].relationship,
			ariaLabel: buildEdgeAriaLabel({
				sourceLabel: sourceNode.label,
				targetLabel: targetNode.label,
				kind: edge.kind,
				evidence: edge.evidence,
			}),
		});
	}
	edges.sort((a, b) => a.id.localeCompare(b.id));

	const truncated =
		[...visitedComponents].some((id) => sets.get(id)?.truncated ?? false) ||
		nodeLimitReached;
	if (nodeLimitReached) {
		limitations.add(
			`Node limit reached (${nodeLimit}). ${kindVisible.length - keptNodes.length} lower-priority nodes are hidden.`,
		);
	}

	const rootNode = nodeMap.get(rootComponentId);
	const hiddenByKind = nodeMap.size - kindVisible.length;
	const matchCount = keptNodes.filter((node) => node.matchesQuery).length;
	const status: GraphViewStatus =
		input.status === "ready" || input.status === undefined
			? keptNodes.length <= 1 && edges.length === 0
				? "empty"
				: "ready"
			: input.status;

	return {
		status,
		rootComponentId,
		...(rootNode ? { rootLabel: rootNode.label } : {}),
		nodes: keptNodes,
		edges,
		nodeCount: keptNodes.length,
		edgeCount: edges.length,
		hiddenByKind,
		matchCount,
		...(selectedNodeId ? { selectedNodeId } : {}),
		depth,
		nodeLimit,
		nodeLimitReached,
		truncated,
		limitations: [...limitations],
		...(input.reason ? { reason: input.reason } : {}),
	};
}

function matchesQuery(
	query: string,
	searchText: string,
	label: string,
): boolean {
	if (!query) return true;
	return searchText.includes(query) || label.toLowerCase().includes(query);
}

function emptyView(input: {
	readonly status: GraphViewStatus;
	readonly depth: number;
	readonly nodeLimit: number;
	readonly rootComponentId?: string;
	readonly reason?: string;
	readonly limitations: readonly string[];
}): GraphView {
	return {
		status: input.status,
		...(input.rootComponentId
			? { rootComponentId: input.rootComponentId }
			: {}),
		nodes: [],
		edges: [],
		nodeCount: 0,
		edgeCount: 0,
		hiddenByKind: 0,
		matchCount: 0,
		depth: input.depth,
		nodeLimit: input.nodeLimit,
		nodeLimitReached: false,
		truncated: false,
		limitations: input.limitations,
		...(input.reason ? { reason: input.reason } : {}),
	};
}

export function edgesForNode(
	view: GraphView,
	nodeId: string | undefined,
): readonly GraphEdgeView[] {
	if (!nodeId) return [];
	return view.edges.filter(
		(edge) => edge.source === nodeId || edge.target === nodeId,
	);
}

export function nodeById(
	view: GraphView,
	nodeId: string | undefined,
): GraphNodeView | undefined {
	if (!nodeId) return undefined;
	return view.nodes.find((node) => node.id === nodeId);
}

export function findNodeByLabel(
	view: GraphView,
	label: string,
): GraphNodeView | undefined {
	const normalized = label.trim().toLowerCase();
	if (!normalized) return undefined;
	return view.nodes.find((node) => node.label.toLowerCase() === normalized);
}

/**
 * Describes why a graph has no visible dependency nodes. This keeps the empty
 * states specific instead of showing a blank canvas.
 */
export function describeEmptyReason(
	view: GraphView,
	input: {
		readonly runtimeStatus: string;
		readonly dependenciesCapable: boolean;
		readonly dependencySetLoaded: boolean;
		readonly hiddenByKind: number;
	},
): string {
	if (view.reason) return view.reason;
	if (input.runtimeStatus === "unavailable") {
		return "The React runtime is not connected. Open the app with the DevTools provider enabled.";
	}
	if (input.runtimeStatus === "error") {
		return "The React runtime reported an error while extracting dependencies.";
	}
	if (!input.dependenciesCapable) {
		return "This React adapter cannot extract reactive dependencies. No graph is fabricated as a fallback.";
	}
	if (!input.dependencySetLoaded) {
		return "Dependency data is still loading for the selected component.";
	}
	if (input.hiddenByKind > 0) {
		return `All ${input.hiddenByKind} dependency node(s) are hidden by the active category filter.`;
	}
	return "No observable reactive dependencies were found for this component. Hooks that cannot be classified are omitted rather than guessed.";
}

export function countByNodeKind(
	view: GraphView,
): ReadonlyMap<DependencyNodeKind, number> {
	const counts = new Map<DependencyNodeKind, number>();
	for (const node of view.nodes) {
		counts.set(node.kind, (counts.get(node.kind) ?? 0) + 1);
	}
	return counts;
}

export function describeLimitations(
	view: GraphView,
	runtimeLimitations: readonly string[],
): readonly string[] {
	const merged = new Set<string>();
	for (const item of runtimeLimitations) merged.add(item);
	for (const item of view.limitations) merged.add(item);
	return [...merged];
}

export function nodeKindTitle(kind: DependencyNodeKind): string {
	return NODE_KIND_META[kind].description;
}

export function edgeKindTitle(kind: DependencyEdgeKind): string {
	return EDGE_KIND_META[kind].description;
}
