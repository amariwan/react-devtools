import { describe, expect, expectTypeOf, it } from "vitest";
import {
  RUNTIME_SERVICE_IDS,
  createUnavailableSnapshot,
  type RuntimeServiceSnapshot,
} from "@next-devtools/contracts";
import { createCoreRuntimeServices } from "@next-devtools/core";

describe("runtime service contracts", () => {
  it("preserves the unavailable reason in an immutable snapshot shape", () => {
    const snapshot = createUnavailableSnapshot("adapter not connected");

    expect(snapshot).toEqual({
      status: "unavailable",
      data: undefined,
      reason: "adapter not connected",
      revision: 0,
    });
    expectTypeOf(snapshot).toEqualTypeOf<RuntimeServiceSnapshot<undefined>>();
    expectTypeOf(snapshot)
      .toHaveProperty("status")
      .toEqualTypeOf<"unavailable">();
  });

  it("publishes stable namespaced service IDs", () => {
    expect(RUNTIME_SERVICE_IDS).toEqual({
      react: "next-devtools.runtime.react",
      routes: "next-devtools.runtime.routes",
      timeline: "next-devtools.runtime.timeline",
      network: "next-devtools.runtime.network",
      stores: "next-devtools.runtime.stores",
      editor: "next-devtools.runtime.editor",
      sessions: "next-devtools.runtime.sessions",
      diagnostics: "next-devtools.runtime.diagnostics",
    });
  });

  it("creates one default instance of every core-owned runtime service", () => {
    const runtime = createCoreRuntimeServices({
      network: { performanceObserverFactory: null },
    });

    expect(runtime.timeline.getSnapshot().status).toBe("available");
    expect(runtime.sessions.getSnapshot().status).toBe("available");
    expect(runtime.network.getSnapshot().status).toBe("unavailable");
    expect(runtime.stores.getSnapshot().status).toBe("available");
    expect(runtime.diagnostics.getSnapshot().status).toBe("available");
    expect(runtime.timeline).not.toBe(createCoreRuntimeServices().timeline);
  });
});
