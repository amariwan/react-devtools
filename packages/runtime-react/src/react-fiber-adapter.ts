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

import type {
  ComponentDetail,
  ComponentNode,
  ReactBridgeAdapter,
  ReactBridgeCapability,
  ReactCommitEvent,
  SuspenseBoundaryStatus,
} from "./react-bridge.js";

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

type FiberKind = ComponentNode["kind"];

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
const MAX_PROP_KEYS = 60;
const MAX_ARRAY_ITEMS = 60;
const MAX_HOOKS = 60;
const MAX_CONTEXTS = 40;
const MAX_STRING_LENGTH = 400;

export function classifyFiberKind(fiber: FiberLike): FiberKind | null {
  if (typeof fiber.tag !== "number") return null;
  return TAG_KIND[fiber.tag] ?? null;
}

function functionName(value: unknown): string | undefined {
  if (typeof value !== "function") return undefined;
  const fn = value as AnyFunction & { displayName?: string; name?: string };
  return fn.displayName ?? (fn.name || undefined);
}

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
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_TREE_NODES;
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

type FiberHookLike = {
  memoizedState?: unknown;
  next?: FiberHookLike | null;
  queue?: {
    dispatch?: unknown;
    lastRenderedReducer?: unknown;
    lastRenderedState?: unknown;
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
};

function defaultGetWindow(): ReactWindowLike | undefined {
  if (typeof window === "undefined") return undefined;
  return window as unknown as ReactWindowLike;
}

function hasDom(windowLike: ReactWindowLike | undefined): boolean {
  return Boolean(windowLike && windowLike.document);
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
