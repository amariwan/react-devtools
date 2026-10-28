import { describe, expect, it, vi } from "vitest";
import {
  wrapCacheOperation,
  wrapProxyOperation,
  wrapServerAction,
} from "../../packages/host-next/src/server-actions";

describe("server operation metadata wrappers", () => {
  it("records bounded success metadata without payloads", async () => {
    const onMeta = vi.fn();
    const action = wrapServerAction(
      "saveProfile",
      async (id: string) => ({ id }),
      onMeta,
    );
    await expect(action("user-1")).resolves.toEqual({ id: "user-1" });

    expect(onMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "action",
        name: "saveProfile",
        status: "ok",
      }),
    );
    expect(onMeta.mock.calls[0]?.[0]).not.toHaveProperty("result");
  });

  it("distinguishes cache and proxy operations", async () => {
    const cacheMeta = vi.fn();
    const proxyMeta = vi.fn();
    await wrapCacheOperation("getDashboard", async () => 1, cacheMeta)();
    await wrapProxyOperation("proxyRequest", async () => 2, proxyMeta)();

    expect(cacheMeta).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "cache" }),
    );
    expect(proxyMeta).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "proxy" }),
    );
  });

  it("records errors and preserves the original exception", async () => {
    const onMeta = vi.fn();
    const error = new Error("database unavailable");
    const action = wrapServerAction(
      "load",
      async () => {
        throw error;
      },
      onMeta,
    );

    await expect(action()).rejects.toBe(error);
    expect(onMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "action",
        status: "error",
        name: "load",
      }),
    );
  });
});
