// Fiber-based React adapter.
//
// This is the default implementation backing the React runtime bridge when no
// React DevTools backend is connected. It reads the fiber tree that React
// itself keeps on DOM containers (`__reactContainer$…`) or on rendered
// elements (`__reactFiber$…`), plus the `__REACT_DEVTOOLS_GLOBAL_HOOK__`
// renderer registry when a hook is installed.
//
// Everything here is read-only. The adapter never mutates React internals and
// never fabricates a source location: when React did not record where a
// component was defined, the node simply has no `source`.

import { extractComponentDependencies } from "./fiber-dependencies.js";
import {
	buildFiberTree,
	extractComponentDetail,
	getSuspenseBoundaryStatus,
	resolveFiberSource,
} from "./fiber-serialize.js";
import { DEFAULT_MAX_TREE_NODES, type FiberLike } from "./fiber-types.js";
import type {
	DependencyReadOptions,
	ReactBridgeAdapter,
	ReactBridgeCapability,
	ReactCommitEvent,
} from "./react-bridge.js";

// Public fiber surface, split into focused modules. Re-exported here so the
// package root (`index.ts` → `react-fiber-adapter.js`) keeps the same API.
export {
	classifyFiberKind,
	DEFAULT_MAX_TREE_NODES,
	FIBER_TAGS,
} from "./fiber-types.js";
export type {
	FiberContextDependencyLike,
	FiberLike,
	FiberSource,
	FiberSourceLike,
} from "./fiber-types.js";
export {
	buildFiberNode,
	buildFiberTree,
	describeFiber,
	describeHook,
	extractComponentDetail,
	extractContext,
	extractHooks,
	fiberHasState,
	getSuspenseBoundaryStatus,
	resolveFiberSource,
	sanitizeValue,
} from "./fiber-serialize.js";
export type { BuiltFiberTree } from "./fiber-serialize.js";
export {
	detectDependencyHook,
	extractComponentDependencies,
} from "./fiber-dependencies.js";
export type { ExtractDependencyOptions } from "./fiber-dependencies.js";

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

type RendererRootLike = { current?: FiberLike | null };

type ReactDevtoolsHookLike = {
	renderers?: Map<number, unknown> | Set<number>;
	getFiberRoots?: (rendererId: number) => Set<RendererRootLike> | undefined;
	onCommitFiberRoot?: (
		rendererId: number,
		root: RendererRootLike,
		priority?: number,
		...args: unknown[]
	) => void;
};

type ReactWindowLike = {
	document?: Document | null;
	MutationObserver?: typeof MutationObserver;
	NodeFilter?: typeof NodeFilter;
	__REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevtoolsHookLike;
};

export interface ReactFiberAdapterOptions {
	/** Injectable window for tests (defaults to `globalThis.window`). */
	getWindow?: () => ReactWindowLike | undefined;
	maxNodes?: number;
	/** Debounce for DOM-mutation driven change notifications. */
	notifyDebounceMs?: number;
}

export interface ReactFiberAdapter extends ReactBridgeAdapter {
	readonly kind: "fiber";
	dispose(): void;
}

const FIBER_CAPABILITIES: ReactBridgeCapability = {
	tree: true,
	props: true,
	hooks: true,
	source: true,
	profiler: false,
	selection: true,
	dependencies: true,
};

function defaultGetWindow(): ReactWindowLike | undefined {
	if (typeof window === "undefined") return undefined;
	return window as unknown as ReactWindowLike;
}

function hasDom(windowLike: ReactWindowLike | undefined): boolean {
	return Boolean(windowLike?.document);
}

function collectRootsFromHook(
	hook: ReactDevtoolsHookLike | undefined,
): FiberLike[] {
	if (!hook || typeof hook.getFiberRoots !== "function") return [];
	const rendererIds = new Set<number>();
	if (hook.renderers instanceof Map) {
		for (const id of hook.renderers.keys()) rendererIds.add(id);
	} else if (hook.renderers instanceof Set) {
		for (const id of hook.renderers) rendererIds.add(id);
	}
	const roots: FiberLike[] = [];
	for (const id of rendererIds) {
		const fiberRoots = hook.getFiberRoots(id);
		if (!fiberRoots) continue;
		for (const root of fiberRoots) {
			if (root?.current) roots.push(root.current);
		}
	}
	return roots;
}

/** Fiber React attached to a rendered DOM element (not the host root). */
export function findElementFiber(node: unknown): FiberLike | undefined {
	if (!node || typeof node !== "object") return undefined;
	const record = node as Record<string, unknown>;
	const key = Object.keys(record).find(
		(name) =>
			name.startsWith("__reactFiber$") ||
			name.startsWith("__reactInternalInstance$"),
	);
	if (!key) return undefined;
	return (record[key] as FiberLike | undefined) ?? undefined;
}

/** Finds the HostRoot fiber of any DOM element by walking up React's keys. */
export function findFiberFromDomNode(node: unknown): FiberLike | undefined {
	if (!node || typeof node !== "object") return undefined;
	const record = node as Record<string, unknown>;
	const containerKey = Object.keys(record).find((name) =>
		name.startsWith("__reactContainer$"),
	);
	if (containerKey) {
		return (record[containerKey] as FiberLike | undefined) ?? undefined;
	}
	let current = findElementFiber(node);
	let steps = 0;
	while (current?.return && steps < 5000) {
		current = current.return;
		steps++;
	}
	return current;
}

function collectRootsFromDom(
	windowLike: ReactWindowLike | undefined,
): FiberLike[] {
	const doc = windowLike?.document;
	if (!doc) return [];
	const roots: FiberLike[] = [];
	const seen = new Set<FiberLike>();
	const rootNode = doc.documentElement ?? doc.body;
	if (!rootNode) return roots;
	const showElement = windowLike?.NodeFilter?.SHOW_ELEMENT ?? 1;
	const walker = doc.createTreeWalker(rootNode, showElement);

	let element: Element | null = rootNode;
	let inspected = 0;
	while (element && inspected < 10000) {
		inspected++;
		const keys = Object.keys(element);
		const containerKey = keys.find((key) =>
			key.startsWith("__reactContainer$"),
		);
		if (containerKey) {
			const fiber = (element as unknown as Record<string, unknown>)[
				containerKey
			] as FiberLike | undefined;
			if (fiber && !seen.has(fiber)) {
				seen.add(fiber);
				roots.push(fiber);
			}
		}
		element = walker.nextNode() as Element | null;
	}
	return roots;
}

export function createReactFiberAdapter(
	options: ReactFiberAdapterOptions = {},
): ReactFiberAdapter {
	const getWindow = options.getWindow ?? defaultGetWindow;
	const maxNodes = options.maxNodes ?? DEFAULT_MAX_TREE_NODES;
	const debounceMs = options.notifyDebounceMs ?? 120;
	const fibersById = new Map<string, FiberLike>();
	const idsByFiber = new WeakMap<object, string>();
	let nextId = 0;
	let disposed = false;
	let observer: MutationObserver | undefined;
	let notifyTimer: ReturnType<typeof setTimeout> | undefined;

	function getId(fiber: FiberLike): string {
		const existing = idsByFiber.get(fiber as object);
		if (existing) return existing;
		const id = `fiber-${nextId++}`;
		idsByFiber.set(fiber as object, id);
		return id;
	}

	function discoverRoots(): FiberLike[] {
		const windowLike = getWindow();
		if (!windowLike) return [];
		const fromHook = collectRootsFromHook(
			windowLike.__REACT_DEVTOOLS_GLOBAL_HOOK__,
		);
		if (fromHook.length > 0) return fromHook;
		return collectRootsFromDom(windowLike);
	}

	function ensureIndex(): void {
		const roots = discoverRoots();
		const nextFibers = new Map<string, FiberLike>();
		for (const root of roots) {
			const rootId = getId(root);
			nextFibers.set(rootId, root);
			const built = buildFiberTree(root, { getId, maxNodes });
			for (const [id, nodeFiber] of built.fibers) nextFibers.set(id, nodeFiber);
		}
		// Fiber identity is retained weakly. Keep only the current index strongly
		// referenced so replaced roots and old trees can be collected between
		// refreshes instead of accumulating for the lifetime of the page.
		fibersById.clear();
		for (const [id, fiber] of nextFibers) fibersById.set(id, fiber);
	}

	function lookupFiber(id: string): FiberLike | undefined {
		let fiber = fibersById.get(id);
		if (!fiber) {
			ensureIndex();
			fiber = fibersById.get(id);
		}
		return fiber;
	}

	const adapter: ReactFiberAdapter = {
		kind: "fiber",

		isAvailable() {
			const windowLike = getWindow();
			if (!windowLike) return false;
			return (
				hasDom(windowLike) || Boolean(windowLike.__REACT_DEVTOOLS_GLOBAL_HOOK__)
			);
		},

		getCapabilities() {
			const hook = getWindow()?.__REACT_DEVTOOLS_GLOBAL_HOOK__;
			return {
				...FIBER_CAPABILITIES,
				profiler: typeof hook?.onCommitFiberRoot === "function",
			};
		},

		getRoots() {
			if (disposed) return [];
			ensureIndex();
			return discoverRoots().map((fiber) => getId(fiber));
		},

		getTree(rootId) {
			if (disposed) return [];
			const root = lookupFiber(rootId);
			if (!root) return [];
			return buildFiberTree(root, { getId, maxNodes }).nodes;
		},

		getSuspenseBoundaries(rootId) {
			if (disposed) return [];
			const root = lookupFiber(rootId);
			if (!root) return [];
			const built = buildFiberTree(root, { getId, maxNodes });
			return built.nodes.flatMap((node) => {
				const fiber = built.fibers.get(node.id);
				const status = fiber ? getSuspenseBoundaryStatus(fiber) : undefined;
				return status
					? [{ id: node.id, displayName: node.displayName, status }]
					: [];
			});
		},

		getDetail(id) {
			if (disposed) return undefined;
			const fiber = lookupFiber(id);
			if (!fiber) return undefined;
			return extractComponentDetail(fiber, id);
		},

		getSource(id) {
			if (disposed) return undefined;
			const fiber = lookupFiber(id);
			if (!fiber) return undefined;
			return resolveFiberSource(fiber);
		},

		getDependencies(id: string, options?: DependencyReadOptions) {
			if (disposed) return undefined;
			const fiber = lookupFiber(id);
			if (!fiber) return undefined;
			return extractComponentDependencies(fiber, id, {
				getId,
				includeProviders: options?.includeProviders !== false,
			});
		},

		selectByDomNode(node) {
			if (disposed) return undefined;
			const fiber = findElementFiber(node);
			if (!fiber) return undefined;
			let current: FiberLike | undefined = fiber;
			let steps = 0;
			while (current && steps < 5000) {
				const id = idsByFiber.get(current as object);
				if (id && fibersById.has(id)) return id;
				current = current.return ?? undefined;
				steps++;
			}
			// The tree may not have been read yet: index it and try again.
			ensureIndex();
			current = fiber;
			steps = 0;
			while (current && steps < 5000) {
				const id = idsByFiber.get(current as object);
				if (id && fibersById.has(id)) return id;
				current = current.return ?? undefined;
				steps++;
			}
			return undefined;
		},

		subscribe(listener) {
			if (disposed) return () => undefined;
			const windowLike = getWindow();
			const MutationObserverCtor =
				windowLike?.MutationObserver ??
				(typeof MutationObserver !== "undefined"
					? MutationObserver
					: undefined);
			const doc = windowLike?.document;
			const schedule = () => {
				if (disposed) return;
				if (notifyTimer !== undefined) clearTimeout(notifyTimer);
				notifyTimer = setTimeout(() => {
					notifyTimer = undefined;
					if (!disposed) listener();
				}, debounceMs);
			};
			if (!MutationObserverCtor || !doc) return () => undefined;
			observer = new MutationObserverCtor(schedule);
			observer.observe(doc.documentElement ?? doc, {
				childList: true,
				subtree: true,
				attributes: false,
				characterData: false,
			});
			return () => {
				if (notifyTimer !== undefined) {
					clearTimeout(notifyTimer);
					notifyTimer = undefined;
				}
				observer?.disconnect();
				observer = undefined;
			};
		},

		subscribeToCommits(listener: (event: ReactCommitEvent) => void) {
			if (disposed) return () => undefined;
			const hook = getWindow()?.__REACT_DEVTOOLS_GLOBAL_HOOK__;
			const original = hook?.onCommitFiberRoot;
			if (!hook || typeof original !== "function") return () => undefined;

			const wrapped = (
				rendererId: number,
				root: RendererRootLike,
				priority?: number,
				...args: unknown[]
			) => {
				original.call(hook, rendererId, root, priority, ...args);
				const rootId = root.current ? getId(root.current) : undefined;
				listener({
					rendererId,
					...(rootId ? { rootId } : {}),
					...(priority !== undefined ? { priority } : {}),
				});
			};
			hook.onCommitFiberRoot = wrapped;

			return () => {
				if (hook.onCommitFiberRoot === wrapped)
					hook.onCommitFiberRoot = original;
			};
		},

		dispose() {
			if (disposed) return;
			disposed = true;
			if (notifyTimer !== undefined) {
				clearTimeout(notifyTimer);
				notifyTimer = undefined;
			}
			observer?.disconnect();
			observer = undefined;
			fibersById.clear();
		},
	};

	return adapter;
}
