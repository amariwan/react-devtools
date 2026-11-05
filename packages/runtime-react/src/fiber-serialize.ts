// Fiber serialization: classification, naming, tree building, value
// sanitization, and component-detail extraction.
//
// These functions convert raw React fibers into the `ComponentNode` and
// `ComponentDetail` shapes consumed by the UI layer.

import {
	FIBER_TAGS,
	type FiberKind,
	type FiberLike,
	type FiberSource,
	type FiberSourceLike,
	MAX_ARRAY_ITEMS,
	MAX_CONTEXTS,
	MAX_HOOKS,
	MAX_PROP_KEYS,
	MAX_STRING_LENGTH,
	classifyFiberKind,
	functionName,
} from "./fiber-types.js";
import type {
	ComponentDetail,
	ComponentNode,
	SuspenseBoundaryStatus,
} from "./react-bridge.js";

function objectName(value: unknown): string | undefined {
	if (!value || typeof value !== "object") return undefined;
	const record = value as { displayName?: unknown; name?: unknown };
	if (typeof record.displayName === "string" && record.displayName)
		return record.displayName;
	if (typeof record.name === "string" && record.name) return record.name;
	return undefined;
}

/** Human readable name for a fiber, matching React DevTools conventions. */
export function describeFiber(
	fiber: FiberLike,
	kind: FiberKind | null = classifyFiberKind(fiber),
): string {
	if (kind === "root") return "Root";
	if (kind === "fragment") return "Fragment";
	if (kind === "suspense") return "Suspense";
	if (kind === "portal") return "Portal";
	if (kind === "profiler") {
		const id = objectName(fiber.type) ?? objectName(fiber.elementType);
		return id ? `Profiler(${id})` : "Profiler";
	}
	if (kind === "context") {
		const name =
			objectName(fiber.type) ??
			objectName(fiber.elementType) ??
			objectName((fiber.type as { _context?: unknown } | null)?._context);
		if (name) return name;
		return fiber.tag === FIBER_TAGS.ContextConsumer
			? "Context.Consumer"
			: "Context.Provider";
	}
	if (kind === "lazy") {
		const inner =
			functionName(fiber.type) ??
			objectName(fiber.type) ??
			objectName((fiber.type as { _payload?: unknown } | null)?._payload);
		return inner ? `Lazy(${inner})` : "Lazy";
	}
	if (kind === "memo") {
		const inner = functionName(fiber.type) ?? objectName(fiber.type);
		return inner ? `Memo(${inner})` : "Memo";
	}
	if (kind === "forwardRef") {
		const render = (fiber.type as { render?: unknown } | null)?.render;
		const inner =
			objectName(fiber.type) ??
			functionName(render) ??
			functionName(fiber.type);
		return inner ? `ForwardRef(${inner})` : "ForwardRef";
	}
	if (kind === "host") {
		const name =
			typeof fiber.type === "string"
				? fiber.type
				: (objectName(fiber.type) ?? objectName(fiber.elementType));
		return name ?? "Unknown";
	}
	// function / class / offscreen / anything else
	const named =
		functionName(fiber.type) ??
		objectName(fiber.type) ??
		functionName(fiber.elementType) ??
		objectName(fiber.elementType);
	if (named) return named;
	return kind === "class" ? "AnonymousClass" : "Anonymous";
}

function normalizeSource(
	source: FiberSourceLike | null | undefined,
): FiberSource | undefined {
	if (!source) return undefined;
	const file =
		typeof source.fileName === "string" ? source.fileName : undefined;
	const line =
		typeof source.lineNumber === "number" && source.lineNumber > 0
			? source.lineNumber
			: undefined;
	if (!file || line === undefined) return undefined;
	const column =
		typeof source.columnNumber === "number" && source.columnNumber > 0
			? source.columnNumber
			: 1;
	return { file, line, column };
}

/**
 * Nearest recorded source location for a fiber: its own `_debugSource`, then
 * the closest ancestor that has one (the fiber a JSX element was created in).
 * Returns undefined instead of guessing.
 */
export function resolveFiberSource(
	fiber: FiberLike,
	maxAncestors = 60,
): FiberSource | undefined {
	let current: FiberLike | null | undefined = fiber;
	let steps = 0;
	while (current && steps <= maxAncestors) {
		const own = normalizeSource(current._debugSource);
		if (own) return own;
		current = current.return;
		steps++;
	}
	return undefined;
}

export function fiberHasState(
	fiber: FiberLike,
	kind: FiberKind | null = classifyFiberKind(fiber),
): boolean {
	if (kind === "class") {
		const state = (fiber.stateNode as { state?: unknown } | null)?.state;
		if (state !== undefined && state !== null) return true;
		return fiber.memoizedState !== undefined && fiber.memoizedState !== null;
	}
	if (kind === "function") {
		return fiber.memoizedState !== undefined && fiber.memoizedState !== null;
	}
	return false;
}

export function buildFiberNode(
	fiber: FiberLike,
	id: string,
	parentId: string | null,
): ComponentNode {
	const kind = classifyFiberKind(fiber) ?? "function";
	const node: ComponentNode = {
		id,
		displayName: describeFiber(fiber, kind),
		kind,
		parentId,
		childIds: [],
		hasState: fiberHasState(fiber, kind),
	};
	const source = resolveFiberSource(fiber);
	if (source) node.source = source;
	return node;
}

export type BuiltFiberTree = {
	readonly nodes: ComponentNode[];
	readonly fibers: Map<string, FiberLike>;
};

/**
 * Depth-first walk over a fiber subtree. Fibers that are not components (host
 * text, modes, …) are transparent: their children re-parent to the closest
 * component ancestor, so the produced tree mirrors what DevTools shows.
 */
export function buildFiberTree(
	root: FiberLike,
	options: {
		getId: (fiber: FiberLike) => string;
		maxNodes?: number;
	},
): BuiltFiberTree {
	const maxNodes = options.maxNodes ?? 4000;
	const nodes: ComponentNode[] = [];
	const fibers = new Map<string, FiberLike>();
	const nodesById = new Map<string, ComponentNode>();
	const stack: Array<{ fiber: FiberLike; parentId: string | null }> = [
		{ fiber: root, parentId: null },
	];

	while (stack.length > 0 && nodes.length < maxNodes) {
		const frame = stack.pop()!;
		const kind = classifyFiberKind(frame.fiber);
		let parentId = frame.parentId;
		if (kind) {
			const id = options.getId(frame.fiber);
			const existing = nodesById.get(id);
			if (existing) {
				parentId = id;
			} else {
				const node = buildFiberNode(frame.fiber, id, frame.parentId);
				nodesById.set(id, node);
				fibers.set(id, frame.fiber);
				nodes.push(node);
				if (frame.parentId) {
					nodesById.get(frame.parentId)?.childIds.push(id);
				}
				parentId = id;
			}
		}

		const children: FiberLike[] = [];
		for (let child = frame.fiber.child; child; child = child.sibling) {
			children.push(child);
		}
		for (let index = children.length - 1; index >= 0; index--) {
			stack.push({ fiber: children[index]!, parentId });
		}
	}

	return { nodes, fibers };
}

export function getSuspenseBoundaryStatus(
	fiber: FiberLike,
): SuspenseBoundaryStatus | undefined {
	if (
		fiber.tag !== FIBER_TAGS.SuspenseComponent &&
		fiber.tag !== FIBER_TAGS.SuspenseListComponent
	) {
		return undefined;
	}
	if (fiber.memoizedState === null) return "resolved";
	if (fiber.memoizedState === undefined) return "unknown";
	if (
		fiber.memoizedState &&
		typeof fiber.memoizedState === "object" &&
		"dehydrated" in fiber.memoizedState &&
		(fiber.memoizedState as { dehydrated?: unknown }).dehydrated
	) {
		return "dehydrated";
	}
	return "suspended";
}

/** Removes non-serializable values so snapshots stay printable and safe. */
export function sanitizeValue(
	value: unknown,
	depth = 0,
	seen: WeakSet<object> = new WeakSet(),
): unknown {
	if (value === null) return null;
	const type = typeof value;
	if (type === "undefined") return undefined;
	if (type === "string") {
		const text = value as string;
		return text.length > MAX_STRING_LENGTH
			? `${text.slice(0, MAX_STRING_LENGTH)}…`
			: text;
	}
	if (type === "number" || type === "boolean") return value;
	if (type === "bigint") return `${String(value)}n`;
	if (type === "symbol") return String(value);
	if (type === "function") {
		const name = (value as { name?: string }).name;
		return `[Function ${name || "anonymous"}]`;
	}

	const record = value as Record<string, unknown>;
	if (
		typeof record.nodeType === "number" &&
		typeof record.nodeName === "string"
	) {
		return `<${record.nodeName.toLowerCase()}>`;
	}
	if ("$$typeof" in record && ("type" in record || "props" in record)) {
		const elementType = record.type;
		const name =
			typeof elementType === "string"
				? elementType
				: (objectName(elementType) ?? functionName(elementType) ?? "Unknown");
		return `[ReactElement <${name}>]`;
	}
	if (depth >= 3) {
		return Array.isArray(value) ? "[Array]" : "[Object]";
	}
	if (seen.has(value as object)) return "[Circular]";
	seen.add(value as object);
	try {
		if (Array.isArray(value)) {
			const items = value
				.slice(0, MAX_ARRAY_ITEMS)
				.map((item) => sanitizeValue(item, depth + 1, seen));
			if (value.length > MAX_ARRAY_ITEMS)
				items.push(`…${value.length - MAX_ARRAY_ITEMS} more`);
			return items;
		}
		if (value instanceof Map) {
			return Array.from(value.entries())
				.slice(0, MAX_ARRAY_ITEMS)
				.map(([key, entry]) => [
					sanitizeValue(key, depth + 1, seen),
					sanitizeValue(entry, depth + 1, seen),
				]);
		}
		if (value instanceof Set) {
			return Array.from(value.values())
				.slice(0, MAX_ARRAY_ITEMS)
				.map((entry) => sanitizeValue(entry, depth + 1, seen));
		}
		if (value instanceof Date) return value.toISOString();
		if (value instanceof Error) return `${value.name}: ${value.message}`;
		const result: Record<string, unknown> = {};
		let count = 0;
		for (const key of Object.keys(record)) {
			if (count >= MAX_PROP_KEYS) {
				result["…"] = "truncated";
				break;
			}
			result[key] = sanitizeValue(record[key], depth + 1, seen);
			count++;
		}
		return result;
	} finally {
		seen.delete(value as object);
	}
}

function sanitizeRecord(value: unknown): Record<string, unknown> {
	const sanitized = sanitizeValue(value, 0);
	if (sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)) {
		return sanitized as Record<string, unknown>;
	}
	return {};
}

export type FiberHookLike = {
	memoizedState?: unknown;
	next?: FiberHookLike | null;
	queue?: {
		dispatch?: unknown;
		lastRenderedReducer?: unknown;
		lastRenderedState?: unknown;
		getSnapshot?: unknown;
		value?: unknown;
	} | null;
};

export function describeHook(hook: FiberHookLike, index: number): string {
	const state = hook.memoizedState;
	if (state && typeof state === "object") {
		const record = state as Record<string, unknown>;
		if (
			typeof record.create === "function" ||
			"destroy" in record ||
			"deps" in record
		) {
			return `Effect #${index}`;
		}
		if (Array.isArray(state) && state.length === 2) {
			return typeof state[0] === "function"
				? `Callback #${index}`
				: `Memo #${index}`;
		}
		if ("current" in record && Object.keys(record).length === 1) {
			return `Ref #${index}`;
		}
	}
	if (hook.queue && typeof hook.queue === "object") {
		if (hook.queue.lastRenderedReducer) return `Reducer #${index}`;
		if (typeof hook.queue.dispatch === "function") return `State #${index}`;
	}
	return `Hook #${index}`;
}

function hookValue(hook: FiberHookLike, name: string): unknown {
	if (name.startsWith("Effect")) {
		const effect = hook.memoizedState as { deps?: unknown[] | null } | null;
		return { deps: sanitizeValue(effect?.deps ?? null) };
	}
	return sanitizeValue(hook.memoizedState);
}

export function extractHooks(fiber: FiberLike): Array<{
	name: string;
	value: unknown;
}> {
	const hooks: Array<{ name: string; value: unknown }> = [];
	let hook = fiber.memoizedState as FiberHookLike | null | undefined;
	let index = 0;
	// Function components keep a linked list in memoizedState; class and host
	// fibers keep unrelated data there, so only walk plain hook-shaped nodes.
	while (hook && typeof hook === "object" && index < MAX_HOOKS) {
		const name = describeHook(hook, index);
		hooks.push({ name, value: hookValue(hook, name) });
		hook = hook.next;
		index++;
	}
	return hooks;
}

export function extractContext(fiber: FiberLike): Array<{
	name: string;
	value: unknown;
}> {
	const contexts: Array<{ name: string; value: unknown }> = [];
	let dependency = fiber.dependencies?.firstContext ?? null;
	let index = 0;
	while (dependency && index < MAX_CONTEXTS) {
		const context = dependency.context;
		const name =
			context?.displayName ??
			context?._context?.displayName ??
			`Context #${index}`;
		contexts.push({ name, value: sanitizeValue(dependency.memoizedValue) });
		dependency = dependency.next ?? null;
		index++;
	}
	return contexts;
}

export function extractComponentDetail(
	fiber: FiberLike,
	id: string,
): ComponentDetail {
	const kind = classifyFiberKind(fiber);
	const props = sanitizeRecord(fiber.memoizedProps);
	const isFunction =
		kind === "function" || kind === "memo" || kind === "forwardRef";
	const hooks = isFunction ? extractHooks(fiber) : [];
	const stateValue =
		kind === "class"
			? sanitizeValue(
					(fiber.stateNode as { state?: unknown } | null)?.state ?? null,
				)
			: null;
	return {
		id,
		props,
		hooks,
		state: stateValue,
		context: extractContext(fiber),
	};
}
