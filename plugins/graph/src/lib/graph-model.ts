import type {
	DependencyEdgeKind,
	DependencyNodeKind,
	DependencySource,
	EvidenceStatus,
} from "@next-devtools/runtime-react";

export type {
	DependencyEdgeKind,
	DependencyNodeKind,
	DependencySource,
	EvidenceStatus,
};

/** Hard cap on rendered dependency nodes. The runtime also caps extraction. */
export const DEFAULT_GRAPH_NODE_LIMIT = 320;
export const MIN_GRAPH_NODE_LIMIT = 40;
export const MAX_GRAPH_NODE_LIMIT = 600;

export const DEFAULT_GRAPH_DEPTH = 2;
export const MAX_GRAPH_DEPTH = 3;

export interface NodeKindMeta {
	readonly kind: DependencyNodeKind;
	readonly label: string;
	readonly shortLabel: string;
	readonly description: string;
}

export const NODE_KIND_META: Readonly<
	Record<DependencyNodeKind, NodeKindMeta>
> = {
	component: {
		kind: "component",
		label: "Component",
		shortLabel: "Cmp",
		description: "A React component reachable from the selected component.",
	},
	prop: {
		kind: "prop",
		label: "Prop",
		shortLabel: "Prop",
		description:
			"A prop recorded on the fiber. Passing is observed; reading it in render is not provable.",
	},
	state: {
		kind: "state",
		label: "State",
		shortLabel: "State",
		description: "A useState value observed on the component's hook list.",
	},
	reducer: {
		kind: "reducer",
		label: "Reducer",
		shortLabel: "Red",
		description: "A useReducer value observed on the hook list.",
	},
	memo: {
		kind: "memo",
		label: "Memo",
		shortLabel: "Memo",
		description: "A useMemo value and its observed dependency array.",
	},
	callback: {
		kind: "callback",
		label: "Callback",
		shortLabel: "Cb",
		description: "A useCallback value and its observed dependency array.",
	},
	effect: {
		kind: "effect",
		label: "Effect",
		shortLabel: "Eff",
		description:
			"An effect hook and its dependency array. Passive vs layout is not distinguished.",
	},
	context: {
		kind: "context",
		label: "Context",
		shortLabel: "Ctx",
		description:
			"A consumed context. Provider identity is verified by object identity.",
	},
	"external-store": {
		kind: "external-store",
		label: "External store",
		shortLabel: "Store",
		description:
			"A useSyncExternalStore-shaped subscription. Store identity is not retained by Fiber.",
	},
	selector: {
		kind: "selector",
		label: "Selector",
		shortLabel: "Sel",
		description:
			"A selector relationship reported by an authorized adapter. Not emitted by the Fiber adapter.",
	},
};

export const NODE_KIND_ORDER: readonly DependencyNodeKind[] = [
	"component",
	"prop",
	"state",
	"reducer",
	"memo",
	"callback",
	"effect",
	"context",
	"external-store",
	"selector",
];

export interface EdgeKindMeta {
	readonly kind: DependencyEdgeKind;
	readonly label: string;
	readonly relationship: string;
	readonly description: string;
}

export const EDGE_KIND_META: Readonly<
	Record<DependencyEdgeKind, EdgeKindMeta>
> = {
	reads: {
		kind: "reads",
		label: "Reads",
		relationship: "reads",
		description: "The component receives a prop from its parent.",
	},
	consumes: {
		kind: "consumes",
		label: "Consumes",
		relationship: "consumes",
		description: "The component consumes a context value.",
	},
	subscribes: {
		kind: "subscribes",
		label: "Subscribes",
		relationship: "subscribes to",
		description: "The component subscribes to an external store.",
	},
	"depends-on": {
		kind: "depends-on",
		label: "Depends on",
		relationship: "depends on",
		description: "A hook value or verified provider relationship.",
	},
	"observed-update": {
		kind: "observed-update",
		label: "Observed update",
		relationship: "observed update from",
		description:
			"Reserved for render causality established by instrumentation. Not emitted by the Fiber adapter.",
	},
};

export const EDGE_KIND_ORDER: readonly DependencyEdgeKind[] = [
	"reads",
	"consumes",
	"subscribes",
	"depends-on",
	"observed-update",
];

export const EVIDENCE_META: Readonly<
	Record<
		EvidenceStatus,
		{ readonly label: string; readonly description: string }
	>
> = {
	observed: {
		label: "Observed",
		description: "Directly observed in React Fiber data.",
	},
	partial: {
		label: "Partial",
		description:
			"Partially observable. The relationship is real but Fiber cannot prove the full semantics.",
	},
	unavailable: {
		label: "Unavailable",
		description: "The runtime cannot supply this dependency.",
	},
};

export type GraphViewStatus =
	| "unavailable"
	| "unsupported"
	| "loading"
	| "error"
	| "empty"
	| "ready";

export interface GraphNodeView {
	readonly id: string;
	readonly kind: DependencyNodeKind;
	readonly label: string;
	readonly componentId: string;
	readonly evidence: EvidenceStatus;
	readonly evidenceSource: string;
	readonly note?: string;
	readonly value?: unknown;
	readonly valueLabel?: string;
	readonly deps?: unknown;
	readonly depsLabel?: string;
	readonly hookIndex?: number;
	readonly source?: DependencySource;
	readonly providerComponentId?: string;
	readonly providerDisplayName?: string;
	/** Graph distance from the selected component. The root is 0. */
	readonly depth: number;
	readonly root: boolean;
	/** True when this component has a loaded dependency set to expand. */
	readonly expandable: boolean;
	readonly searchText: string;
	readonly matchesQuery: boolean;
	readonly ariaLabel: string;
}

export interface GraphEdgeView {
	readonly id: string;
	readonly source: string;
	readonly target: string;
	readonly kind: DependencyEdgeKind;
	readonly evidence: EvidenceStatus;
	readonly evidenceSource: string;
	readonly note?: string;
	readonly relationshipLabel: string;
	readonly ariaLabel: string;
}

export interface GraphView {
	readonly status: GraphViewStatus;
	readonly rootComponentId?: string;
	readonly rootLabel?: string;
	readonly nodes: readonly GraphNodeView[];
	readonly edges: readonly GraphEdgeView[];
	readonly nodeCount: number;
	readonly edgeCount: number;
	/** Nodes hidden by the active category filter. */
	readonly hiddenByKind: number;
	/** Nodes matching the current search query (or all when empty). */
	readonly matchCount: number;
	readonly selectedNodeId?: string;
	readonly depth: number;
	readonly nodeLimit: number;
	readonly nodeLimitReached: boolean;
	readonly truncated: boolean;
	readonly limitations: readonly string[];
	readonly reason?: string;
}

export interface GraphNodeFilters {
	readonly nodes: ReadonlySet<DependencyNodeKind>;
	readonly edges: ReadonlySet<DependencyEdgeKind>;
}

export function createDefaultNodeFilters(): ReadonlySet<DependencyNodeKind> {
	return new Set(NODE_KIND_ORDER);
}

export function createDefaultEdgeFilters(): ReadonlySet<DependencyEdgeKind> {
	return new Set(EDGE_KIND_ORDER);
}

export function isDependencyNodeKind(
	value: unknown,
): value is DependencyNodeKind {
	return (
		typeof value === "string" &&
		(NODE_KIND_ORDER as readonly string[]).includes(value)
	);
}

export function isDependencyEdgeKind(
	value: unknown,
): value is DependencyEdgeKind {
	return (
		typeof value === "string" &&
		(EDGE_KIND_ORDER as readonly string[]).includes(value)
	);
}

export function nodeKindLabel(kind: DependencyNodeKind): string {
	return NODE_KIND_META[kind]?.label ?? kind;
}

export function edgeKindLabel(kind: DependencyEdgeKind): string {
	return EDGE_KIND_META[kind]?.label ?? kind;
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

/**
 * Renders an already-sanitized runtime value for display. Values originate from
 * the runtime adapter, which never hands UI code live object references.
 */
export function formatDependencyValue(
	value: unknown,
	maxLength = 120,
): string | undefined {
	if (value === undefined) return undefined;
	if (value === null) return "null";
	if (typeof value === "string")
		return truncate(JSON.stringify(value), maxLength);
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (typeof value === "bigint") return `${value}n`;
	if (typeof value === "symbol") return value.toString();
	if (typeof value === "function") {
		const name = (value as { name?: string }).name;
		return name ? `[Function ${name}]` : "[Function]";
	}
	if (Array.isArray(value)) {
		return `Array(${value.length})`;
	}
	if (typeof value === "object") {
		try {
			return truncate(JSON.stringify(value), maxLength);
		} catch {
			return "{…}";
		}
	}
	return String(value);
}

export function formatDependencyArray(
	deps: unknown,
	maxLength = 120,
): string | undefined {
	if (deps === undefined) return undefined;
	if (deps === null) return "[] (no dependencies)";
	if (!Array.isArray(deps)) return formatDependencyValue(deps, maxLength);
	if (deps.length === 0) return "[] (no dependencies)";
	const items = deps.map((item) => formatDependencyValue(item, 36) ?? "—");
	return truncate(`[${items.join(", ")}]`, maxLength);
}

export function buildNodeSearchText(input: {
	readonly label: string;
	readonly kind: DependencyNodeKind;
	readonly componentId: string;
	readonly evidenceSource: string;
	readonly note?: string;
	readonly providerDisplayName?: string;
}): string {
	return [
		input.label,
		nodeKindLabel(input.kind),
		input.kind,
		input.componentId,
		input.evidenceSource,
		input.note ?? "",
		input.providerDisplayName ?? "",
	]
		.join(" ")
		.toLowerCase();
}

export function buildNodeAriaLabel(node: {
	readonly label: string;
	readonly kind: DependencyNodeKind;
	readonly evidence: EvidenceStatus;
	readonly note?: string;
}): string {
	const parts = [
		node.label,
		nodeKindLabel(node.kind),
		`${EVIDENCE_META[node.evidence].label} evidence`,
	];
	if (node.note) parts.push(node.note);
	return parts.join(". ");
}

export function buildEdgeAriaLabel(edge: {
	readonly sourceLabel: string;
	readonly targetLabel: string;
	readonly kind: DependencyEdgeKind;
	readonly evidence: EvidenceStatus;
}): string {
	return `${edge.sourceLabel} ${EDGE_KIND_META[edge.kind].relationship} ${edge.targetLabel}. ${EVIDENCE_META[edge.evidence].label} evidence.`;
}
