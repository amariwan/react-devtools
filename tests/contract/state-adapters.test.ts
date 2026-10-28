import { describe, expect, it } from "vitest";
import { createZustandAdapter } from "../../plugins/state-zustand/src/zustand-adapter";
import { createReduxAdapter } from "../../plugins/state-redux/src/redux-adapter";
import { createQueryAdapter } from "../../plugins/state-tanstack-query/src/query-adapter";

describe("read-only state adapters", () => {
  it("bridges Zustand getState and subscribe without mutation", async () => {
    let listener: (() => void) | undefined;
    const adapter = createZustandAdapter(
      {
        id: "counter",
        getState: () => ({ count: 1 }),
        subscribe: (next) => {
          listener = next;
          return () => {
            listener = undefined;
          };
        },
      },
      0,
    );

    expect(adapter?.id).toBe("zustand:counter");
    expect(await adapter?.read()).toEqual({ count: 1 });
    const callback = vi.fn();
    const unsubscribe = adapter?.subscribe(callback);
    listener?.();
    expect(callback).toHaveBeenCalledOnce();
    unsubscribe?.();
    expect(listener).toBeUndefined();
  });

  it("bridges a Redux store read-only", async () => {
    const adapter = createReduxAdapter({
      getState: () => ({ user: { id: 1 } }),
      subscribe: () => () => undefined,
    });

    expect(await adapter?.read()).toEqual({ user: { id: 1 } });
    expect(adapter?.canMutate).not.toBe(true);
  });

  it("projects bounded TanStack Query cache state", async () => {
    const adapter = createQueryAdapter({
      getQueryCache: () => ({
        getAll: () => [
          {
            queryKey: ["todos"],
            state: { status: "success", fetchStatus: "idle", data: [1] },
          },
        ],
        subscribe: () => () => undefined,
      }),
    });

    expect(await adapter?.read()).toEqual([
      {
        queryKey: ["todos"],
        status: "success",
        fetchStatus: "idle",
        data: [1],
        error: undefined,
      },
    ]);
  });
});
