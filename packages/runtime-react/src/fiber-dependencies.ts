// Reactive dependency extraction from React fibers.
//
// Detects useState, useEffect, useRef, useReducer, useContext, and
// custom-hook dependencies, then resolves context providers by walking the
// ancestor chain.

import {
	type FiberHookLike,
	describeFiber,
	fiberHasState,
	resolveFiberSource,
	sanitizeValue,
} from "./fiber-serialize.js";
import {
	FIBER_TAGS,
	type FiberContextDependencyLike,
	type FiberLike,
	MAX_HOOKS,
	classifyFiberKind,
} from "./fiber-types.js";
import type {
	ComponentDependencies,
	DependencyEdge,
	DependencyEdgeKind,
	DependencyNode,
} from "./react-bridge.js";

const MAX_DEPENDENCY_NODES = 240;
const MAX_DEPENDENCY_PROPS = 40;
const MAX_DEPENDENCY_HOOKS = 80;
const MAX_DEPENDENCY_CONTEXTS = 40;
const MAX_DEPENDENCY_CLASS_STATE_FIELDS = 20;
const MAX_PROVIDER_ANCESTORS = 240;

type DetectedDependencyHook =
	| { readonly kind: "state"; readonly index: number; readonly value: unknown }
	| {
			readonly kind: "reducer";
			readonly index: number;
			readonly value: unknown;
			readonly reducerName?: string;
	  }
	| {
			readonly kind: "effect";
			readonly index: number;
			readonly deps: unknown;
			readonly tag?: number;
	  }
	| {
			readonly kind: "memo";
			readonly index: number;
			readonly value: unknown;
			readonly deps: unknown;
	  }
	| {
			readonly kind: "callback";
			readonly index: number;
			readonly value: unknown;
			readonly deps: unknown;
	  }
	| {
			readonly kind: "external-store";
			readonly index: number;
			readonly value: unknown;
			readonly getSnapshotName?: string;
	  }
	| { readonly kind: "ref"; readonly index: number; readonly value: unknown }
	| { readonly kind: "other"; readonly index: number; readonly value: unknown };

function isEffectLike(
	value: unknown,
): value is { readonly deps?: unknown; readonly tag?: number } {
	if (!value || typeof value !== "object") return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.tag === "number" &&
		"deps" in record &&
		("create" in record || "destroy" in record)
	);
}

function isRefLike(value: unknown): boolean {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	return "current" in record && Object.keys(record).length === 1;
}

function functionDisplayName(value: unknown): string | undefined {
	if (typeof value !== "function") return undefined;
	const fn = value as { displayName?: string; name?: string };
	return fn.displayName ?? (fn.name || undefined);
}

/**
 * Classifies a single hook node from React's hook linked list.
 *
 * React does not tag hooks with their public names. The classification below
 * relies on the observable shape React stores per hook and deliberately falls
 * back to `other` when the shape is ambiguous.
 */
export function detectDependencyHook(
	hook: FiberHookLike,
	index: number,
): DetectedDependencyHook {
	const state = hook.memoizedState;
	const queue = hook.queue;

	if (queue && typeof queue.getSnapshot === "function") {
		const getSnapshotName = functionDisplayName(queue.getSnapshot);
		return {
			kind: "external-store",
			index,
			value: sanitizeValue(state),
			...(getSnapshotName ? { getSnapshotName } : {}),
		};
	}

	if (queue && typeof queue.lastRenderedReducer === "function") {
		const reducerName = functionDisplayName(queue.lastRenderedReducer);
		// useState is implemented with React's internal `basicStateReducer`.
		if (reducerName === "basicStateReducer") {
			return { kind: "state", index, value: sanitizeValue(state) };
		}
		return {
			kind: "reducer",
			index,
			value: sanitizeValue(state),
			...(reducerName ? { reducerName } : {}),
		};
	}

	if (queue && typeof queue.dispatch === "function") {
		return { kind: "state", index, value: sanitizeValue(state) };
	}

	if (isEffectLike(state)) {
		return {
			kind: "effect",
			index,
			deps: sanitizeValue(state.deps ?? null),
			...(typeof state.tag === "number" ? { tag: state.tag } : {}),
		};
	}

	if (
		Array.isArray(state) &&
		state.length === 2 &&
		(Array.isArray(state[1]) || state[1] === null || state[1] === undefined)
	) {
		if (typeof state[0] === "function") {
			return {
				kind: "callback",
				index,
				value: sanitizeValue(state[0]),
				deps: sanitizeValue(state[1] ?? null),
			};
		}
		return {
			kind: "memo",
			index,
			value: sanitizeValue(state[0]),
			deps: sanitizeValue(state[1] ?? null),
		};
	}

	if (isRefLike(state)) {
		return {
			kind: "ref",
			index,
			value: sanitizeValue((state as { current?: unknown }).current),
		};
	}

	return { kind: "other", index, value: sanitizeValue(state) };
}

function dependencyNodeId(
	componentId: string,
	scope: string,
	key: string,
): string {
	return `dep:${componentId}:${scope}:${key}`;
}

function dependencyEdgeId(
	source: string,
	kind: DependencyEdgeKind,
	target: string,
): string {
	return `edge:${kind}:${source}->${target}`;
}

function contextDisplayName(
	dependency: FiberContextDependencyLike,
	index: number,
): string {
	return (
		dependency.context?.displayName ??
		dependency.context?._context?.displayName ??
		`Context #${index}`
	);
}

function providerMatchesContext(
	provider: FiberLike,
	context: unknown,
): boolean {
	if (!context) return false;
	if (provider.type === context || provider.elementType === context)
		return true;
	const type = provider.type;
	if (type && typeof type === "object") {
		if ((type as { _context?: unknown })._context === context) return true;
	}
	const elementType = provider.elementType;
	if (elementType && typeof elementType === "object") {
		if ((elementType as { _context?: unknown })._context === context)
			return true;
	}
	return false;
}

function findContextProvider(
	fiber: FiberLike,
	context: unknown,
	getId: (fiber: FiberLike) => string,
): { readonly fiber: FiberLike; readonly id: string } | undefined {
	let current = fiber.return ?? null;
	let steps = 0;
	while (current && steps < MAX_PROVIDER_ANCESTORS) {
		if (
			current.tag === FIBER_TAGS.ContextProvider &&
			providerMatchesContext(current, context)
		) {
			return { fiber: current, id: getId(current) };
		}
		current = current.return ?? null;
		steps++;
	}
	return undefined;
}

export type ExtractDependencyOptions = {
	readonly getId: (fiber: FiberLike) => string;
	readonly includeProviders?: boolean;
	readonly maxNodes?: number;
};

/**
 * Builds an evidence-backed reactive dependency set for one fiber.
 *
 * Every node and edge records where the evidence came from. The function never
 * guesses a dependency: ambiguous hook shapes are omitted, and relationships
 * that Fiber cannot prove (render causality, store identity, prop reads) are
 * marked `partial` or listed under `limitations`.
 */
export function extractComponentDependencies(
	fiber: FiberLike,
	id: string,
	options: ExtractDependencyOptions,
): ComponentDependencies {
	const kind = classifyFiberKind(fiber) ?? "function";
	const source = resolveFiberSource(fiber);
	const maxNodes = options.maxNodes ?? MAX_DEPENDENCY_NODES;
	const includeProviders = options.includeProviders !== false;

	const component = {
		id,
		displayName: describeFiber(fiber, kind),
		kind,
		hasState: fiberHasState(fiber, kind),
		...(source ? { source } : {}),
	};

	const nodes: DependencyNode[] = [
		{
			id,
			kind: "component",
			label: component.displayName,
			componentId: id,
			evidence: "observed",
			evidenceSource: "fiber identity",
			...(source ? { source } : {}),
			...(typeof fiber.key === "string" && fiber.key
				? { note: `React key: ${fiber.key}` }
				: {}),
		},
	];
	const edges: DependencyEdge[] = [];
	const limitations: string[] = [];
	let truncated = false;
	const seenNodeIds = new Set<string>([id]);
	const seenEdgeIds = new Set<string>();

	const addNode = (node: DependencyNode): boolean => {
		if (seenNodeIds.has(node.id)) return true;
		if (nodes.length >= maxNodes) {
			truncated = true;
			return false;
		}
		seenNodeIds.add(node.id);
		nodes.push(node);
		return true;
	};

	const addEdge = (edge: DependencyEdge): void => {
		if (seenEdgeIds.has(edge.id)) return;
		seenEdgeIds.add(edge.id);
		edges.push(edge);
	};

	// --- Props ---------------------------------------------------------------
	const props = fiber.memoizedProps;
	if (props && typeof props === "object" && !Array.isArray(props)) {
		const keys = Object.keys(props as Record<string, unknown>);
		const selected = keys.slice(0, MAX_DEPENDENCY_PROPS);
		if (keys.length > selected.length) {
			truncated = true;
			limitations.push(
				`Props were truncated to ${MAX_DEPENDENCY_PROPS} of ${keys.length} keys.`,
			);
		}
		for (const key of selected) {
			const propNodeId = dependencyNodeId(id, "prop", key);
			const added = addNode({
				id: propNodeId,
				kind: "prop",
				label: key,
				componentId: id,
				evidence: "partial",
				evidenceSource: "fiber.memoizedProps",
				note: "Fiber records the prop as passed. Whether render reads it is not provable from Fiber.",
				value: sanitizeValue((props as Record<string, unknown>)[key]),
			});
			if (!added) break;
			addEdge({
				id: dependencyEdgeId(id, "reads", propNodeId),
				source: id,
				target: propNodeId,
				kind: "reads",
				evidence: "partial",
				evidenceSource: "fiber.memoizedProps",
				note: "Prop is passed to this component; read access is not provable.",
			});
		}
		if (selected.length > 0) {
			limitations.push(
				"Props are observed as passed to the component; reading them inside render is not provable from Fiber.",
			);
		}
	}

	// --- Hooks ---------------------------------------------------------------
	const functionLike =
		kind === "function" ||
		kind === "memo" ||
		kind === "forwardRef" ||
		kind === "class";
	if (functionLike) {
		let hook = fiber.memoizedState as FiberHookLike | null | undefined;
		let index = 0;
		let hookNodes = 0;
		let sawRef = false;
		let sawEffect = false;
		let sawDepsArray = false;
		let sawExternalStore = false;

		while (
			hook &&
			typeof hook === "object" &&
			index < MAX_HOOKS &&
			hookNodes < MAX_DEPENDENCY_HOOKS
		) {
			const detected = detectDependencyHook(hook, index);
			const base = {
				componentId: id,
				hookIndex: index,
			} as const;

			switch (detected.kind) {
				case "state": {
					const nodeId = dependencyNodeId(id, "state", String(index));
					if (
						!addNode({
							...base,
							id: nodeId,
							kind: "state",
							label: `State #${index}`,
							evidence: "observed",
							evidenceSource: "fiber hook list (useState)",
							value: detected.value,
						})
					)
						break;
					addEdge({
						id: dependencyEdgeId(id, "depends-on", nodeId),
						source: id,
						target: nodeId,
						kind: "depends-on",
						evidence: "observed",
						evidenceSource: "fiber hook list",
					});
					hookNodes++;
					break;
				}
				case "reducer": {
					const nodeId = dependencyNodeId(id, "reducer", String(index));
					if (
						!addNode({
							...base,
							id: nodeId,
							kind: "reducer",
							label: `Reducer #${index}`,
							evidence: "observed",
							evidenceSource: "fiber hook list (useReducer)",
							...(detected.reducerName
								? { note: `Reducer: ${detected.reducerName}` }
								: {}),
							value: detected.value,
						})
					)
						break;
					addEdge({
						id: dependencyEdgeId(id, "depends-on", nodeId),
						source: id,
						target: nodeId,
						kind: "depends-on",
						evidence: "observed",
						evidenceSource: "fiber hook list",
					});
					hookNodes++;
					break;
				}
				case "effect": {
					const nodeId = dependencyNodeId(id, "effect", String(index));
					if (
						!addNode({
							...base,
							id: nodeId,
							kind: "effect",
							label: `Effect #${index}`,
							evidence: "observed",
							evidenceSource: "fiber hook list (effect)",
							deps: detected.deps,
							note: "Effect kind (passive/layout) and causality are not distinguished by this adapter.",
						})
					)
						break;
					addEdge({
						id: dependencyEdgeId(id, "depends-on", nodeId),
						source: id,
						target: nodeId,
						kind: "depends-on",
						evidence: "observed",
						evidenceSource: "fiber hook list",
					});
					hookNodes++;
					sawEffect = true;
					break;
				}
				case "memo": {
					const nodeId = dependencyNodeId(id, "memo", String(index));
					const functionValue =
						typeof detected.value === "string" &&
						detected.value.startsWith("[Function ");
					if (
						!addNode({
							...base,
							id: nodeId,
							kind: "memo",
							label: `Memo #${index}`,
							evidence: functionValue ? "partial" : "observed",
							evidenceSource: "fiber hook list (memoized value)",
							deps: detected.deps,
							value: detected.value,
							...(functionValue
								? {
										note: "Value is a function; useMemo returning a function cannot be distinguished from useCallback.",
									}
								: {}),
						})
					)
						break;
					addEdge({
						id: dependencyEdgeId(id, "depends-on", nodeId),
						source: id,
						target: nodeId,
						kind: "depends-on",
						evidence: functionValue ? "partial" : "observed",
						evidenceSource: "fiber hook list",
					});
					hookNodes++;
					sawDepsArray = true;
					break;
				}
				case "callback": {
					const nodeId = dependencyNodeId(id, "callback", String(index));
					if (
						!addNode({
							...base,
							id: nodeId,
							kind: "callback",
							label: `Callback #${index}`,
							evidence: "observed",
							evidenceSource: "fiber hook list (memoized callback)",
							deps: detected.deps,
							value: detected.value,
						})
					)
						break;
					addEdge({
						id: dependencyEdgeId(id, "depends-on", nodeId),
						source: id,
						target: nodeId,
						kind: "depends-on",
						evidence: "observed",
						evidenceSource: "fiber hook list",
					});
					hookNodes++;
					sawDepsArray = true;
					break;
				}
				case "external-store": {
					const nodeId = dependencyNodeId(id, "store", String(index));
					if (
						!addNode({
							...base,
							id: nodeId,
							kind: "external-store",
							label: `External store #${index}`,
							evidence: "partial",
							evidenceSource: "fiber hook list (useSyncExternalStore shape)",
							value: detected.value,
							...(detected.getSnapshotName
								? {
										note: `Snapshot getter: ${detected.getSnapshotName}. Fiber retains neither the store identity nor the subscribe function.`,
									}
								: {
										note: "Fiber retains the snapshot getter, not the store identity or subscribe function.",
									}),
						})
					)
						break;
					addEdge({
						id: dependencyEdgeId(id, "subscribes", nodeId),
						source: id,
						target: nodeId,
						kind: "subscribes",
						evidence: "partial",
						evidenceSource: "fiber hook list (useSyncExternalStore shape)",
					});
					hookNodes++;
					sawExternalStore = true;
					break;
				}
				case "ref": {
					sawRef = true;
					break;
				}
				default:
					break;
			}

			hook = hook.next;
			index++;
		}

		if (sawEffect) {
			limitations.push(
				"Effect dependency arrays are observed, but links to the hook that produced each dependency value are not provable.",
			);
		}
		if (sawDepsArray) {
			limitations.push(
				"Memo and callback dependency arrays are observed as values; producer links are not provable.",
			);
		}
		if (sawExternalStore) {
			limitations.push(
				"External store identity and selectors are not retained by Fiber; only the subscription shape is observable.",
			);
		}
		if (sawRef) {
			limitations.push(
				"Refs are not reactive dependencies and are omitted from the graph.",
			);
		}
	}

	// --- Class state ---------------------------------------------------------
	if (kind === "class") {
		const classState = (fiber.stateNode as { state?: unknown } | null)?.state;
		if (
			classState &&
			typeof classState === "object" &&
			!Array.isArray(classState)
		) {
			const keys = Object.keys(classState as Record<string, unknown>).slice(
				0,
				MAX_DEPENDENCY_CLASS_STATE_FIELDS,
			);
			for (const key of keys) {
				const nodeId = dependencyNodeId(id, "class-state", key);
				if (
					!addNode({
						id: nodeId,
						kind: "state",
						label: `state.${key}`,
						componentId: id,
						evidence: "observed",
						evidenceSource: "fiber.stateNode.state",
						value: sanitizeValue((classState as Record<string, unknown>)[key]),
					})
				)
					break;
				addEdge({
					id: dependencyEdgeId(id, "depends-on", nodeId),
					source: id,
					target: nodeId,
					kind: "depends-on",
					evidence: "observed",
					evidenceSource: "fiber.stateNode.state",
				});
			}
		}
	} else if (kind !== "function" && kind !== "memo" && kind !== "forwardRef") {
		limitations.push(
			`Hook-level dependencies are unavailable for ${kind} components.`,
		);
	}

	// --- Context -------------------------------------------------------------
	let contextDependency = fiber.dependencies?.firstContext ?? null;
	let contextIndex = 0;
	let unresolvedContexts = 0;
	const providerNodeIds = new Set<string>();

	while (contextDependency && contextIndex < MAX_DEPENDENCY_CONTEXTS) {
		const name = contextDisplayName(contextDependency, contextIndex);
		const contextNodeId = dependencyNodeId(
			id,
			"context",
			`${contextIndex}-${name}`,
		);
		const context = contextDependency.context ?? null;
		const provider =
			includeProviders && context
				? findContextProvider(fiber, context, options.getId)
				: undefined;

		if (
			addNode({
				id: contextNodeId,
				kind: "context",
				label: name,
				componentId: id,
				evidence: "observed",
				evidenceSource: "fiber.dependencies.firstContext",
				value: sanitizeValue(contextDependency.memoizedValue),
				...(provider
					? {
							providerComponentId: provider.id,
							providerDisplayName: describeFiber(provider.fiber),
						}
					: {}),
			})
		) {
			addEdge({
				id: dependencyEdgeId(id, "consumes", contextNodeId),
				source: id,
				target: contextNodeId,
				kind: "consumes",
				evidence: "observed",
				evidenceSource: "fiber.dependencies.firstContext",
			});

			if (provider && provider.id !== id && includeProviders) {
				if (!providerNodeIds.has(provider.id)) {
					const providerSource = resolveFiberSource(provider.fiber);
					const added = addNode({
						id: provider.id,
						kind: "component",
						label: describeFiber(provider.fiber),
						componentId: provider.id,
						evidence: "observed",
						evidenceSource: "context identity matched to ancestor provider",
						note: `Provides ${name}`,
						...(providerSource ? { source: providerSource } : {}),
					});
					if (added) providerNodeIds.add(provider.id);
				}
				if (providerNodeIds.has(provider.id)) {
					addEdge({
						id: dependencyEdgeId(contextNodeId, "depends-on", provider.id),
						source: contextNodeId,
						target: provider.id,
						kind: "depends-on",
						evidence: "observed",
						evidenceSource:
							"context object identity matched to ancestor provider",
						note: `Context value is provided by ${describeFiber(provider.fiber)}.`,
					});
				}
			}
		} else {
			break;
		}

		if (!provider) unresolvedContexts++;
		contextDependency = contextDependency.next ?? null;
		contextIndex++;
	}

	if (contextIndex > 0 && unresolvedContexts > 0) {
		limitations.push(
			`${unresolvedContexts} consumed context value(s) have no verified provider in the ancestor chain.`,
		);
	}

	limitations.push(
		"State-update → render causality requires instrumentation and is not claimed by this adapter.",
	);

	return {
		component,
		nodes,
		edges,
		limitations,
		truncated,
	};
}

// ---------------------------------------------------------------------------
