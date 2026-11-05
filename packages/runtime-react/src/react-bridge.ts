// React introspection bridge types and helpers.
// Primary: reuse React DevTools backend path (pinned version tests).
// This module must not import React DevTools internals directly; adapter isolates them.

export type ReactBridgeCapability = {
	tree: boolean;
	props: boolean;
	hooks: boolean;
	source: boolean;
	profiler: boolean;
	selection: boolean;
	/**
	 * Reactive dependency extraction. Optional so existing adapters stay
	 * source-compatible; `true` only when the adapter can prove dependencies.
	 */
	dependencies?: boolean;
};

export type ComponentKind =
	| "function"
	| "class"
	| "host"
	| "suspense"
	| "fragment"
	| "portal"
	| "memo"
	| "forwardRef"
	| "root"
	| "context"
	| "profiler"
	| "lazy"
	| "offscreen";

export type ComponentNode = {
	id: string;
	displayName: string;
	kind: ComponentKind;
	parentId: string | null;
	childIds: string[];
	source?: { file: string; line: number; column: number };
	hasState: boolean;
};

export type ComponentDetail = {
	id: string;
	props: Record<string, unknown>;
	hooks: Array<{ name: string; value: unknown }>;
	state: unknown;
	context: Array<{ name: string; value: unknown }>;
};

// ---------------------------------------------------------------------------
// Reactive dependency model
// ---------------------------------------------------------------------------

/**
 * Categories of reactive values a component can depend on.
 *
 * These mirror what the Graph plugin renders. A category is only ever emitted
 * when the runtime has evidence for it; absence does not imply the component
 * uses it.
 */
export type DependencyNodeKind =
	| "component"
	| "prop"
	| "state"
	| "reducer"
	| "memo"
	| "callback"
	| "effect"
	| "context"
	| "external-store"
	| "selector";

/**
 * Evidence-backed relationship kinds. `observed-update` is reserved for
 * causality established by instrumentation; the fiber adapter does not claim
 * it.
 */
export type DependencyEdgeKind =
	| "reads"
	| "consumes"
	| "subscribes"
	| "depends-on"
	| "observed-update";

export type EvidenceStatus = "observed" | "partial" | "unavailable";

export type DependencySource = {
	readonly file: string;
	readonly line: number;
	readonly column: number;
};

export type DependencyNode = {
	readonly id: string;
	readonly kind: DependencyNodeKind;
	readonly label: string;
	/** Component the value belongs to (the inspected component or a provider). */
	readonly componentId: string;
	readonly evidence: EvidenceStatus;
	/** Where the evidence came from, e.g. `fiber.memoizedProps`. */
	readonly evidenceSource: string;
	readonly note?: string;
	/** Sanitized runtime value, when safely observable. */
	readonly value?: unknown;
	/** Sanitized dependency array for memo/callback/effect nodes. */
	readonly deps?: unknown;
	/** Position in the component's hook list, when applicable. */
	readonly hookIndex?: number;
	readonly source?: DependencySource;
	/** For context nodes: the verified provider component, when found. */
	readonly providerComponentId?: string;
	readonly providerDisplayName?: string;
};

export type DependencyEdge = {
	readonly id: string;
	readonly source: string;
	readonly target: string;
	readonly kind: DependencyEdgeKind;
	readonly evidence: EvidenceStatus;
	readonly evidenceSource: string;
	readonly note?: string;
};

export type DependencyComponent = {
	readonly id: string;
	readonly displayName: string;
	readonly kind: ComponentKind;
	readonly hasState: boolean;
	readonly source?: DependencySource;
};

/**
 * A verified reactive dependency set for one component.
 *
 * `nodes` always includes the inspected component itself as the first node so
 * consumers can render a self-contained graph without inventing a center.
 */
export type ComponentDependencies = {
	readonly component: DependencyComponent;
	readonly nodes: readonly DependencyNode[];
	readonly edges: readonly DependencyEdge[];
	/** Human-readable capability gaps for this extraction. */
	readonly limitations: readonly string[];
	/** True when a safety limit cut the result short. */
	readonly truncated: boolean;
};

export type DependencyReadOptions = {
	/** Include verified ancestor context provider components. Defaults to true. */
	includeProviders?: boolean;
};

export type ReactCommitEvent = {
	readonly rendererId: number;
	readonly rootId?: string;
	readonly priority?: number;
};

export type SuspenseBoundaryStatus =
	| "resolved"
	| "suspended"
	| "dehydrated"
	| "unknown";

export type SuspenseBoundary = {
	readonly id: string;
	readonly displayName: string;
	readonly status: SuspenseBoundaryStatus;
};

export interface ReactBridge {
	isAvailable(): boolean;
	getCapabilities(): ReactBridgeCapability;
	getRoots(): string[];
	getTree(rootId: string): ComponentNode[];
	getDetail(id: string): ComponentDetail | undefined;
	getSource(
		id: string,
	): { file: string; line: number; column: number } | undefined;
	// selection: highlight DOM node
	selectByDomNode(node: unknown): string | undefined;
	// profiling
	startProfiling(): void;
	stopProfiling(): { commits: number };
}

type MaybePromise<T> = T | Promise<T>;

export interface ReactBridgeAdapter {
	isAvailable(): boolean;
	getCapabilities(): ReactBridgeCapability;
	getRoots(): MaybePromise<string[]>;
	getTree(rootId: string): MaybePromise<ComponentNode[]>;
	getDetail(id: string): MaybePromise<ComponentDetail | undefined>;
	getSource(
		id: string,
	): MaybePromise<{ file: string; line: number; column: number } | undefined>;
	getDependencies?(
		id: string,
		options?: DependencyReadOptions,
	): MaybePromise<ComponentDependencies | undefined>;
	selectByDomNode(node: unknown): MaybePromise<string | undefined>;
	getSuspenseBoundaries?(rootId: string): MaybePromise<SuspenseBoundary[]>;
	subscribe?(listener: () => void): () => void;
	subscribeToCommits?(listener: (event: ReactCommitEvent) => void): () => void;
	dispose?(): void;
}

export const REACT_DEVTOOLS_BASELINE = {
	reactCommit: "fd51cb10dd154aee73e4e7948005c02968651c3d",
	reactDevtoolsInlineVersion: "8.0.0",
} as const;

// Early hook installation helper. Must run before React loads.
// In Next, place in instrumentation-client.ts.
export const REACT_DEVTOOLS_GLOBAL_HOOK_KEY = "__REACT_DEVTOOLS_GLOBAL_HOOK__";

export function installReactDevtoolsHookEarly(): boolean {
	if (typeof globalThis === "undefined") return false;
	const g = globalThis as Record<string, unknown>;
	return Boolean(g[REACT_DEVTOOLS_GLOBAL_HOOK_KEY]);
}

export function detectReactDevtoolsExtension(): boolean {
	if (typeof globalThis === "undefined") return false;
	const g = globalThis as Record<string, unknown>;
	const hook = g[REACT_DEVTOOLS_GLOBAL_HOOK_KEY] as
		| { _extension?: boolean }
		| undefined;
	return Boolean(hook?._extension);
}
