import { describe, expect, it } from "vitest";
import {
  FIBER_TAGS,
  buildFiberTree,
  classifyFiberKind,
  createReactFiberAdapter,
  describeFiber,
  extractComponentDetail,
  findFiberFromDomNode,
  getSuspenseBoundaryStatus,
  resolveFiberSource,
  sanitizeValue,
  type FiberLike,
} from "@next-devtools/runtime-react";

function link(parent: FiberLike, children: FiberLike[]): FiberLike {
  parent.child = children[0] ?? null;
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!;
    child.return = parent;
    child.sibling = children[index + 1] ?? null;
  }
  return parent;
}

function fiber(
  tag: number,
  type: unknown,
  props: unknown = {},
  children: FiberLike[] = [],
): FiberLike {
  return link({ tag, type, memoizedProps: props }, children);
}

function nextIdFactory() {
  let next = 0;
  return () => `n${next++}`;
}

function sampleTree() {
  const heading = fiber(FIBER_TAGS.HostComponent, "h1", {
    children: "Hello",
  });
  const counter = fiber(
    FIBER_TAGS.FunctionComponent,
    function Counter() {},
    { start: 1 },
    [heading],
  );
  counter.memoizedState = {
    memoizedState: 1,
    queue: { dispatch: () => undefined },
    next: null,
  };
  counter._debugSource = {
    fileName: "/src/components/counter.tsx",
    lineNumber: 12,
    columnNumber: 5,
  };
  const layout = fiber(FIBER_TAGS.HostComponent, "div", { className: "wrap" }, [
    counter,
  ]);
  const page = fiber(FIBER_TAGS.FunctionComponent, function Page() {}, {}, [
    layout,
  ]);
  const root = fiber(FIBER_TAGS.HostRoot, null, null, [page]);
  return { root, page, layout, counter, heading };
}

describe("react fiber adapter: tree building", () => {
  it("reports Suspense state from explicit Fiber state", () => {
    expect(
      getSuspenseBoundaryStatus({
        tag: FIBER_TAGS.SuspenseComponent,
        memoizedState: null,
      }),
    ).toBe("resolved");
    expect(
      getSuspenseBoundaryStatus({
        tag: FIBER_TAGS.SuspenseComponent,
        memoizedState: { retryLane: 1 },
      }),
    ).toBe("suspended");
    expect(
      getSuspenseBoundaryStatus({
        tag: FIBER_TAGS.SuspenseComponent,
        memoizedState: { dehydrated: {} },
      }),
    ).toBe("dehydrated");
    expect(
      getSuspenseBoundaryStatus({
        tag: FIBER_TAGS.SuspenseComponent,
      }),
    ).toBe("unknown");
    expect(
      getSuspenseBoundaryStatus({ tag: FIBER_TAGS.FunctionComponent }),
    ).toBe(undefined);
  });

  it("classifies fiber tags and names components like DevTools", () => {
    expect(classifyFiberKind({ tag: FIBER_TAGS.HostRoot })).toBe("root");
    expect(classifyFiberKind({ tag: FIBER_TAGS.HostText })).toBeNull();
    expect(classifyFiberKind({ tag: FIBER_TAGS.MemoComponent })).toBe("memo");
    expect(classifyFiberKind({ tag: FIBER_TAGS.ForwardRef })).toBe(
      "forwardRef",
    );
    expect(classifyFiberKind({ tag: FIBER_TAGS.ContextProvider })).toBe(
      "context",
    );
    expect(
      describeFiber({ tag: FIBER_TAGS.HostComponent, type: "button" }),
    ).toBe("button");
    expect(
      describeFiber({
        tag: FIBER_TAGS.FunctionComponent,
        type: function SomeComponent() {},
      }),
    ).toBe("SomeComponent");
    expect(
      describeFiber({
        tag: FIBER_TAGS.MemoComponent,
        type: function Inner() {},
      }),
    ).toBe("Memo(Inner)");
  });

  it("walks the fiber tree, skips host text, and links parent/child ids", () => {
    const { root, page, layout, counter, heading } = sampleTree();
    const text = { tag: FIBER_TAGS.HostText, memoizedProps: "Hello" };
    link(heading, [text]);

    const built = buildFiberTree(root, { getId: nextIdFactory() });
    const byName = new Map(built.nodes.map((node) => [node.displayName, node]));

    expect(built.nodes.map((node) => node.displayName)).toEqual([
      "Root",
      "Page",
      "div",
      "Counter",
      "h1",
    ]);
    expect(byName.get("Page")?.parentId).toBe(byName.get("Root")?.id);
    expect(byName.get("div")?.parentId).toBe(byName.get("Page")?.id);
    expect(byName.get("Counter")?.childIds).toEqual([byName.get("h1")?.id]);
    expect(byName.get("Counter")?.kind).toBe("function");
    expect(byName.get("div")?.kind).toBe("host");
    expect(byName.get("Counter")?.hasState).toBe(true);
    expect(byName.get("div")?.hasState).toBe(false);
    expect(byName.get("Counter")?.source).toEqual({
      file: "/src/components/counter.tsx",
      line: 12,
      column: 5,
    });
    // `page`/`layout` are referenced so the fixture stays honest about shape.
    expect(page.child).toBe(layout);
    expect(counter.child).toBe(heading);
  });

  it("respects the node budget for pathological trees", () => {
    let current = fiber(FIBER_TAGS.FunctionComponent, function Leaf() {});
    for (let index = 0; index < 20; index++) {
      current = fiber(FIBER_TAGS.FunctionComponent, function Nested() {}, {}, [
        current,
      ]);
    }
    const built = buildFiberTree(current, {
      getId: nextIdFactory(),
      maxNodes: 5,
    });
    expect(built.nodes).toHaveLength(5);
  });
});

describe("react fiber adapter: source resolution", () => {
  it("uses the nearest recorded ancestor and never invents a location", () => {
    const { root, page, layout, counter } = sampleTree();
    delete page._debugSource;
    expect(resolveFiberSource(page)).toBeUndefined();

    page._debugSource = {
      fileName: "/src/app/page.tsx",
      lineNumber: 3,
      columnNumber: 1,
    };
    expect(resolveFiberSource(counter)).toEqual({
      file: "/src/components/counter.tsx",
      line: 12,
      column: 5,
    });
    expect(resolveFiberSource(layout)).toEqual({
      file: "/src/app/page.tsx",
      line: 3,
      column: 1,
    });
    // The host root is above the page, so it has no recorded location of its own.
    expect(resolveFiberSource(root)).toBeUndefined();
  });

  it("ignores malformed debug sources", () => {
    expect(
      resolveFiberSource({
        _debugSource: { fileName: null, lineNumber: 4, columnNumber: 2 },
      }),
    ).toBeUndefined();
    expect(
      resolveFiberSource({
        _debugSource: { fileName: "/a.tsx", lineNumber: 0 },
      }),
    ).toBeUndefined();
  });
});

describe("react fiber adapter: detail extraction", () => {
  it("sanitizes props, hooks, state, and context", () => {
    const effect = {
      create: () => undefined,
      destroy: undefined,
      deps: [1],
    };
    const stateHook = {
      memoizedState: { count: 0 },
      queue: { dispatch: () => undefined },
      next: {
        memoizedState: undefined,
        next: {
          memoizedState: effect,
          next: {
            memoizedState: { current: null },
            next: null,
          },
        },
      },
    };
    const component: FiberLike = {
      tag: FIBER_TAGS.FunctionComponent,
      type: function Demo() {},
      memoizedProps: {
        title: "Hello",
        onSelect: () => undefined,
        nested: { level: 1 },
        element: { $$typeof: Symbol.for("react.element"), type: "div" },
      },
      memoizedState: stateHook,
      dependencies: {
        firstContext: {
          memoizedValue: { theme: "dark" },
          context: { displayName: "ThemeContext" },
          next: null,
        },
      },
    };

    const detail = extractComponentDetail(component, "component-1");

    expect(detail.id).toBe("component-1");
    expect(detail.props).toMatchObject({
      title: "Hello",
      onSelect: "[Function onSelect]",
      nested: { level: 1 },
      element: "[ReactElement <div>]",
    });
    expect(detail.hooks.map((hook) => hook.name)).toEqual([
      "State #0",
      "Hook #1",
      "Effect #2",
      "Ref #3",
    ]);
    expect(detail.hooks[2]?.value).toEqual({ deps: [1] });
    expect(detail.context).toEqual([
      { name: "ThemeContext", value: { theme: "dark" } },
    ]);
    expect(detail.state).toBeNull();
  });

  it("reads class component state", () => {
    const detail = extractComponentDetail(
      {
        tag: FIBER_TAGS.ClassComponent,
        type: class Legacy {},
        memoizedProps: {},
        stateNode: { state: { open: true } },
      },
      "class-1",
    );
    expect(detail.state).toEqual({ open: true });
    expect(detail.hooks).toEqual([]);
  });

  it("handles circular and deep values without throwing", () => {
    const circular: Record<string, unknown> = { name: "loop" };
    circular.self = circular;
    const sanitized = sanitizeValue(circular) as Record<string, unknown>;
    expect(sanitized.self).toBe("[Circular]");

    const deep = { a: { b: { c: { d: 1 } } } };
    expect(sanitizeValue(deep)).toEqual({
      a: { b: { c: "[Object]" } },
    });
  });
});

describe("react fiber adapter: adapter surface", () => {
  function fakeWindow(root: FiberLike) {
    return {
      __REACT_DEVTOOLS_GLOBAL_HOOK__: {
        renderers: new Map([[1, {}]]),
        getFiberRoots: () => new Set([{ current: root }]),
      },
    };
  }

  it("reports unavailable without a window", () => {
    const adapter = createReactFiberAdapter({ getWindow: () => undefined });
    expect(adapter.isAvailable()).toBe(false);
    expect(adapter.getRoots()).toEqual([]);
    expect(adapter.getTree("missing")).toEqual([]);
    expect(adapter.getDetail("missing")).toBeUndefined();
    expect(adapter.getSource("missing")).toBeUndefined();
    expect(adapter.selectByDomNode({})).toBeUndefined();
    expect(adapter.subscribe(() => undefined)()).toBeUndefined();
    adapter.dispose();
  });

  it("reads roots, tree, detail, source, and selection through fibers", () => {
    const { root, counter } = sampleTree();
    const adapter = createReactFiberAdapter({
      getWindow: () => fakeWindow(root) as never,
    });

    expect(adapter.isAvailable()).toBe(true);
    expect(adapter.getCapabilities()).toMatchObject({
      tree: true,
      props: true,
      hooks: true,
      source: true,
      selection: true,
    });

    const roots = adapter.getRoots();
    expect(roots).toHaveLength(1);
    const [rootId] = roots as [string];
    const nodes = adapter.getTree(rootId);
    const counterNode = nodes.find((node) => node.displayName === "Counter");
    expect(counterNode).toBeDefined();

    expect(adapter.getDetail(counterNode!.id)?.props).toEqual({ start: 1 });
    expect(adapter.getSource(counterNode!.id)).toEqual({
      file: "/src/components/counter.tsx",
      line: 12,
      column: 5,
    });

    const element = { __reactFiber$abc123: counter };
    expect(adapter.selectByDomNode(element)).toBe(counterNode!.id);
    expect(adapter.selectByDomNode({})).toBeUndefined();
    adapter.dispose();
  });

  it("observes React commit hooks without replacing the existing callback", () => {
    const { root } = sampleTree();
    let originalCalls = 0;
    let originalArgs: unknown[] = [];
    const original = (...args: unknown[]) => {
      originalCalls++;
      originalArgs = args;
    };
    const hook = {
      renderers: new Map([[1, {}]]),
      getFiberRoots: () => new Set([{ current: root }]),
      onCommitFiberRoot: original,
    };
    const adapter = createReactFiberAdapter({
      getWindow: () => ({ __REACT_DEVTOOLS_GLOBAL_HOOK__: hook }) as never,
    });
    const events: unknown[] = [];
    const unsubscribe = adapter.subscribeToCommits?.((event) =>
      events.push(event),
    );
    const [rootId] = adapter.getRoots() as [string];

    expect(adapter.getCapabilities().profiler).toBe(true);
    hook.onCommitFiberRoot(1, { current: root }, 3, true);
    expect(originalCalls).toBe(1);
    expect(originalArgs).toEqual([1, { current: root }, 3, true]);
    expect(events).toEqual([{ rendererId: 1, rootId, priority: 3 }]);

    unsubscribe?.();
    expect(hook.onCommitFiberRoot).toBe(original);
    adapter.dispose();
  });

  it("resolves selection before the tree was read", () => {
    const { root, layout } = sampleTree();
    const adapter = createReactFiberAdapter({
      getWindow: () => fakeWindow(root) as never,
    });
    const element = { __reactFiber$xyz: layout };
    const id = adapter.selectByDomNode(element);
    expect(id).toBeDefined();
    expect(adapter.getDetail(id!)?.props).toEqual({ className: "wrap" });
    adapter.dispose();
  });

  it("returns explicit Suspense diagnostics for the active root", () => {
    const content = fiber(FIBER_TAGS.FunctionComponent, function Content() {});
    const boundary = fiber(
      FIBER_TAGS.SuspenseComponent,
      null,
      { fallback: "Loading" },
      [content],
    );
    boundary.memoizedState = { retryLane: 1 };
    const root = fiber(FIBER_TAGS.HostRoot, null, null, [boundary]);
    const adapter = createReactFiberAdapter({
      getWindow: () => fakeWindow(root) as never,
    });
    const [rootId] = adapter.getRoots() as [string];

    expect(adapter.getSuspenseBoundaries?.(rootId)).toEqual([
      { id: expect.any(String), displayName: "Suspense", status: "suspended" },
    ]);
    adapter.dispose();
  });

  it("drops fibers from replaced roots when the index refreshes", () => {
    const first = sampleTree();
    const second = sampleTree();
    let currentRoot = first.root;
    const adapter = createReactFiberAdapter({
      getWindow: () => fakeWindow(currentRoot) as never,
    });

    const [firstRootId] = adapter.getRoots() as [string];
    expect(adapter.getDetail(firstRootId)).toBeDefined();

    currentRoot = second.root;
    const [secondRootId] = adapter.getRoots() as [string];
    expect(secondRootId).not.toBe(firstRootId);
    expect(adapter.getDetail(firstRootId)).toBeUndefined();
    expect(adapter.getDetail(secondRootId)).toBeDefined();
    adapter.dispose();
  });

  it("finds the host root from a rendered DOM element", () => {
    const { root, counter } = sampleTree();
    const element = { __reactFiber$key: counter };
    expect(findFiberFromDomNode(element)).toBe(root);
  });

  it("is inert after dispose", () => {
    const { root, counter } = sampleTree();
    const adapter = createReactFiberAdapter({
      getWindow: () => fakeWindow(root) as never,
    });
    const roots = adapter.getRoots();
    adapter.dispose();
    expect(adapter.getRoots()).toEqual([]);
    expect(adapter.getTree(roots[0]!)).toEqual([]);
    expect(
      adapter.selectByDomNode({ __reactFiber$k: counter }),
    ).toBeUndefined();
  });
});
