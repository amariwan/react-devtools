import { describe, expect, it } from "vitest";
import {
  createStoreAdapterRegistry,
  type StoreAdapter,
} from "@next-devtools/core";

function adapter(overrides: Partial<StoreAdapter> = {}): StoreAdapter {
  return {
    id: "store",
    label: "Store",
    read: () => ({ count: 1 }),
    subscribe: () => () => undefined,
    ...overrides,
  };
}

describe("store adapter registry", () => {
  it("registers, lists, removes, and rejects duplicate adapters", () => {
    const registry = createStoreAdapterRegistry();
    const remove = registry.register(adapter());

    expect(registry.list()).toEqual([
      { id: "store", label: "Store", canMutate: false },
    ]);
    expect(() => registry.register(adapter())).toThrow(/already registered/);
    remove.unregister();
    expect(registry.list()).toEqual([]);
  });

  it("selects adapters and encodes cyclic snapshots for transport", async () => {
    const cyclic: Record<string, unknown> = { count: 1 };
    cyclic.self = cyclic;
    const registry = createStoreAdapterRegistry();
    registry.register(adapter({ read: () => cyclic }));

    await registry.select("store");

    expect(registry.getSnapshot().data.value).toMatchObject({
      __ndt_type: "object",
      entries: expect.arrayContaining([
        ["self", { __ndt_type: "ref", path: "$" }],
      ]),
    });
  });

  it("refreshes the selected snapshot when its real adapter emits", async () => {
    let listener: (() => void) | undefined;
    let count = 1;
    const registry = createStoreAdapterRegistry();
    registry.register(
      adapter({
        read: () => ({ count }),
        subscribe: (next) => {
          listener = next;
          return () => {
            listener = undefined;
          };
        },
      }),
    );
    await registry.select("store");
    count = 2;

    listener?.();
    await Promise.resolve();

    expect(registry.getSnapshot().data.value).toMatchObject({
      entries: expect.arrayContaining([["count", 2]]),
    });
  });

  it("rejects unsupported mutation without invoking an adapter callback", async () => {
    let calls = 0;
    const registry = createStoreAdapterRegistry();
    registry.register(
      adapter({
        canMutate: true,
        mutate: () => {
          calls++;
          return { ok: true };
        },
      }),
    );
    await registry.select("store");

    await expect(registry.mutate(["count"], 2)).resolves.toEqual({
      ok: false,
      code: "unsupported",
      reason: "Selected store does not support mutation",
    });
    expect(calls).toBe(0);
    expect(registry.getSnapshot().data.canMutate).toBe(false);
  });

  it("returns typed mutation failures and isolates adapter read errors", async () => {
    const registry = createStoreAdapterRegistry({ allowMutations: true });
    registry.register(
      adapter({
        canMutate: true,
        mutate: () => ({ ok: false, code: "invalid", reason: "Unknown path" }),
        read: () => {
          throw new Error("store disconnected");
        },
      }),
    );

    await registry.select("store");

    expect(registry.getSnapshot()).toMatchObject({
      status: "error",
      reason: "store disconnected",
    });
    await expect(registry.mutate(["missing"], 1)).resolves.toEqual({
      ok: false,
      code: "invalid",
      reason: "Unknown path",
    });
  });
});
