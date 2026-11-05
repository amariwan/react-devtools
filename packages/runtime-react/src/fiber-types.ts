// Fiber type definitions and tag classification.
//
// These types model React's internal fiber node structure without importing
// React internals. They are used by the serialization, dependency, and
// adapter modules.

import type { ComponentNode } from "./react-bridge.js";

export type FiberSource = { file: string; line: number; column: number };

export type FiberSourceLike = {
	fileName?: string | null;
	lineNumber?: number | null;
	columnNumber?: number | null;
};

export type FiberContextDependencyLike = {
	memoizedValue?: unknown;
	context?: {
		displayName?: string | null;
		_context?: { displayName?: string | null } | null;
	} | null;
	next?: FiberContextDependencyLike | null;
};

export type FiberLike = {
	tag?: number;
	key?: string | null;
	type?: unknown;
	elementType?: unknown;
	stateNode?: unknown;
	memoizedProps?: unknown;
	memoizedState?: unknown;
	return?: FiberLike | null;
	child?: FiberLike | null;
	sibling?: FiberLike | null;
	_debugSource?: FiberSourceLike | null;
	_debugOwner?: FiberLike | null;
	dependencies?: { firstContext?: FiberContextDependencyLike | null } | null;
};

export type FiberKind = ComponentNode["kind"];

type AnyFunction = (...args: never[]) => unknown;

export const FIBER_TAGS = {
	FunctionComponent: 0,
	ClassComponent: 1,
	IndeterminateComponent: 2,
	HostRoot: 3,
	HostPortal: 4,
	HostComponent: 5,
	HostText: 6,
	Fragment: 7,
	Mode: 8,
	ContextConsumer: 9,
	ContextProvider: 10,
	ForwardRef: 11,
	Profiler: 12,
	SuspenseComponent: 13,
	MemoComponent: 14,
	SimpleMemoComponent: 15,
	LazyComponent: 16,
	IncompleteClassComponent: 17,
	DehydratedFragment: 18,
	SuspenseListComponent: 19,
	ScopeComponent: 21,
	OffscreenComponent: 22,
	LegacyHiddenComponent: 23,
	CacheComponent: 24,
	TracingMarkerComponent: 25,
} as const;

const TAG_KIND: Record<number, FiberKind> = {
	0: "function",
	1: "class",
	2: "function",
	3: "root",
	4: "portal",
	5: "host",
	7: "fragment",
	9: "context",
	10: "context",
	11: "forwardRef",
	12: "profiler",
	13: "suspense",
	14: "memo",
	15: "memo",
	16: "lazy",
	19: "suspense",
	22: "offscreen",
	23: "offscreen",
};

export const DEFAULT_MAX_TREE_NODES = 4000;

export const MAX_PROP_KEYS = 60;
export const MAX_ARRAY_ITEMS = 60;
export const MAX_HOOKS = 60;
export const MAX_CONTEXTS = 40;
export const MAX_STRING_LENGTH = 400;

export function classifyFiberKind(fiber: FiberLike): FiberKind | null {
	const tag = fiber.tag;
	if (tag === undefined) return null;
	return TAG_KIND[tag] ?? null;
}

function functionName(value: unknown): string | undefined {
	if (typeof value !== "function") return undefined;
	const name = (value as AnyFunction).name;
	return name ? name : undefined;
}

export { functionName };
