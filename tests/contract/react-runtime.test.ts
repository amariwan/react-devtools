import { describe, expect, it } from "vitest";
import {
  REACT_DEVTOOLS_GLOBAL_HOOK_KEY,
  createReactRuntimeService,
  installReactDevtoolsHookEarly,
  type ReactBridgeAdapter,
} from "@next-devtools/runtime-react";

const capabilities = {
  tree: true,
  props: true,
  hooks: true,
  source: true,
  profiler: false,
  selection: true,
};

function adapter(
  overrides: Partial<ReactBridgeAdapter> = {},
): ReactBridgeAdapter {
  return {
    isAvailable: () => true,
    getCapabilities: () => capabilities,
    getRoots: () => ["root"],
    getTree: () => [
      {
        id: "app",
        displayName: "App",
        kind: "function",
        parentId: null,
        childIds: [],
        hasState: true,
      },
    ],
    getDetail: () => ({
      id: "app",
      props: { title: "Home" },
      hooks: [],
      state: null,
      context: [],
    }),
    getSource: () => ({ file: "/app/page.tsx", line: 3, column: 5 }),
    selectByDomNode: () => "app",
    ...overrides,
  };
}

/** Lets the adapter-notification refresh microtask chain settle. */
async function flushAsync(): Promise<void> {
  for (let index = 0; index < 4; index++) await Promise.resolve();
}

describe("react runtime service", () => {
  it("reports unavailable without a real adapter and does not install a fake hook", () => {
    const globalRecord = globalThis as Record<string, unknown>;
    const previous = globalRecord[REACT_DEVTOOLS_GLOBAL_HOOK_KEY];
    delete globalRecord[REACT_DEVTOOLS_GLOBAL_HOOK_KEY];

    expect(installReactDevtoolsHookEarly()).toBe(false);
    expect(globalRecord[REACT_DEVTOOLS_GLOBAL_HOOK_KEY]).toBeUndefined();
    expect(createReactRuntimeService().getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "React adapter not connected",
      data: { roots: [], tree: [] },
    });

    if (previous !== undefined)
      globalRecord[REACT_DEVTOOLS_GLOBAL_HOOK_KEY] = previous;
  });

  it("reads roots, tree, detail, source, and DOM selection through the adapter", async () => {
    const service = createReactRuntimeService(adapter());

    await service.refreshRoots();
    await service.readTree("root");
    await service.readDetail("app");
    await service.readSource("app");
    await service.selectByDomNode({});

    expect(service.getSnapshot()).toMatchObject({
      status: "available",
      data: {
        roots: ["root"],
        tree: [{ id: "app", displayName: "App" }],
        detail: { id: "app", props: { title: "Home" } },
        source: { file: "/app/page.tsx", line: 3, column: 5 },
        selectedComponentId: "app",
      },
    });
  });

  it("persists a tree selection in the runtime snapshot", () => {
    const service = createReactRuntimeService(adapter());

    service.selectComponent("app");

    expect(service.getSnapshot().data.selectedComponentId).toBe("app");
    service.selectComponent("app");
    expect(service.getSnapshot().data.selectedComponentId).toBe("app");
  });

  it("reads explicit Suspense diagnostics through the adapter", async () => {
    const service = createReactRuntimeService(
      adapter({
        getSuspenseBoundaries: () => [
          { id: "suspense-1", displayName: "Suspense", status: "suspended" },
        ],
      }),
    );

    await service.readSuspenseBoundaries("root");

    expect(service.getSnapshot().data.suspense).toEqual([
      { id: "suspense-1", displayName: "Suspense", status: "suspended" },
    ]);
  });

  it("suppresses an async result from a replaced adapter", async () => {
    let resolveRoots!: (roots: string[]) => void;
    const pendingRoots = new Promise<string[]>((resolve) => {
      resolveRoots = resolve;
    });
    const service = createReactRuntimeService(
      adapter({ getRoots: () => pendingRoots }),
    );
    const pending = service.refreshRoots();

    service.setAdapter(adapter({ getRoots: () => ["current"] }));
    resolveRoots(["stale"]);
    await pending;
    await service.refreshRoots();

    expect(service.getSnapshot().data.roots).toEqual(["current"]);
  });

  it("detaches subscriptions and disposes adapters exactly once", () => {
    let firstUnsubscribed = 0;
    let firstDisposed = 0;
    let secondDisposed = 0;
    const service = createReactRuntimeService(
      adapter({
        subscribe: () => () => {
          firstUnsubscribed++;
        },
        dispose: () => {
          firstDisposed++;
        },
      }),
    );

    service.setAdapter(
      adapter({
        dispose: () => {
          secondDisposed++;
        },
      }),
    );
    service.dispose();
    service.dispose();

    expect({ firstUnsubscribed, firstDisposed, secondDisposed }).toEqual({
      firstUnsubscribed: 1,
      firstDisposed: 1,
      secondDisposed: 1,
    });
  });

  it("reports unavailable and clears data when the adapter says it is unavailable", async () => {
    const service = createReactRuntimeService(
      adapter({ isAvailable: () => false }),
    );

    await expect(service.refreshRoots()).resolves.toEqual([]);
    await expect(service.readTree("root")).resolves.toEqual([]);
    expect(service.getSnapshot()).toMatchObject({
      status: "unavailable",
      reason: "React adapter unavailable",
      data: { roots: [], tree: [] },
    });
    expect(service.getSnapshot().data.capabilities.tree).toBe(false);
  });

  it("refreshes roots and the visible tree when the adapter notifies", async () => {
    let notify: (() => void) | undefined;
    let version = 1;
    const service = createReactRuntimeService(
      adapter({
        getTree: () => [
          {
            id: "app",
            displayName: `App v${version}`,
            kind: "function",
            parentId: null,
            childIds: [],
            hasState: false,
          },
        ],
        subscribe: (listener) => {
          notify = listener;
          return () => {
            notify = undefined;
          };
        },
      }),
    );

    await service.refreshRoots();
    await service.readTree("root");
    expect(service.getSnapshot().data.tree[0]?.displayName).toBe("App v1");

    version = 2;
    notify?.();
    await flushAsync();

    expect(service.getSnapshot().data.tree[0]?.displayName).toBe("App v2");
    expect(service.getSnapshot().status).toBe("available");
  });

  it("unsubscribes the adapter notifier when the adapter is replaced", async () => {
    let unsubscribed = 0;
    const service = createReactRuntimeService(
      adapter({
        subscribe: () => () => {
          unsubscribed++;
        },
      }),
    );

    await service.refreshRoots();
    await service.readTree("root");
    service.setAdapter(adapter());
    service.dispose();

    expect(unsubscribed).toBe(1);
  });

  it("isolates adapter subscribe failures in an error snapshot", () => {
    const service = createReactRuntimeService(
      adapter({
        subscribe: () => {
          throw new Error("subscribe unavailable");
        },
      }),
    );

    expect(service.getSnapshot()).toMatchObject({
      status: "error",
      reason: "subscribe unavailable",
    });
  });

  it("isolates adapter failures in an error snapshot", async () => {
    const service = createReactRuntimeService(
      adapter({
        getRoots: () => {
          throw new Error("backend disconnected");
        },
      }),
    );

    await expect(service.refreshRoots()).resolves.toEqual([]);
    expect(service.getSnapshot()).toMatchObject({
      status: "error",
      reason: "backend disconnected",
    });
  });
});
