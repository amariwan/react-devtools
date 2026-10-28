import { describe, expect, it, vi } from "vitest";
import {
  createDiagnosticsRuntime,
  parseRuntimeStackFrame,
} from "@next-devtools/core";

describe("diagnostics runtime", () => {
  it("normalizes, bounds, and retains recent error evidence", () => {
    let now = 10;
    const runtime = createDiagnosticsRuntime({ capacity: 1, now: () => now });
    const first = new Error("first");
    first.name = "ExampleError";
    runtime.record({ kind: "error", error: first, route: "/home" });
    now = 20;
    runtime.record({ kind: "unhandled-rejection", error: "second" });

    expect(runtime.getSnapshot().data).toMatchObject({
      dropped: 1,
      events: [
        {
          id: "diag_2",
          kind: "unhandled-rejection",
          message: "second",
          timestampUnixMs: 20,
        },
      ],
    });
  });

  it("disposes without accepting further diagnostics", () => {
    const runtime = createDiagnosticsRuntime();
    runtime.dispose();
    runtime.record({ kind: "error", error: new Error("ignored") });
    expect(runtime.getSnapshot()).toMatchObject({
      status: "unavailable",
      data: { events: [] },
    });
  });

  it("extracts an explicitly approximate source frame from common stacks", () => {
    const stack = [
      "Error: broken",
      "    at Dashboard (http://localhost:3000/_next/app.js:12:34)",
    ].join("\n");
    expect(parseRuntimeStackFrame(stack)).toEqual({
      sourceFrame: {
        source: "http://localhost:3000/_next/app.js",
        line: 12,
        column: 34,
        functionName: "Dashboard",
        origin: "runtime-stack",
        confidence: "approximate",
      },
    });
  });

  it("does not invent a frame for an unmappable stack", () => {
    expect(parseRuntimeStackFrame("Error: broken\n    at native code")).toBe(
      undefined,
    );
  });

  it("upgrades same-origin stack evidence through a bounded source map", async () => {
    vi.stubGlobal("location", {
      href: "http://localhost:3000/",
      origin: "http://localhost:3000",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("app.js")) {
          return {
            ok: true,
            text: async () => `//# sourceMappingURL=app.js.map`,
          };
        }
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              version: 3,
              sources: ["../src/App.tsx"],
              mappings: `${";".repeat(11)}AAAA`,
            }),
        };
      }),
    );

    try {
      const runtime = createDiagnosticsRuntime();
      runtime.record({
        kind: "error",
        error: new Error(
          "broken\n    at Dashboard (http://localhost:3000/_next/app.js:12:34)",
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(runtime.getSnapshot().data.events[0]?.sourceFrame).toMatchObject({
        source: "http://localhost:3000/src/App.tsx",
        line: 1,
        column: 1,
        origin: "source-map",
        confidence: "exact",
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps approximate evidence when a source asset exceeds the read limit", async () => {
    vi.stubGlobal("location", {
      href: "http://localhost:3000/",
      origin: "http://localhost:3000",
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => "1048577" },
      text: async () => "ignored",
    }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      const runtime = createDiagnosticsRuntime();
      runtime.record({
        kind: "error",
        error: new Error(
          "large\n    at Dashboard (http://localhost:3000/_next/app.js:12:34)",
        ),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(runtime.getSnapshot().data.events[0]?.sourceFrame).toMatchObject({
        origin: "runtime-stack",
        confidence: "approximate",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
