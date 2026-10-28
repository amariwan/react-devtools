import { describe, expect, it, vi } from "vitest";
import { createNextRequestErrorHandler } from "../../packages/host-next/src/server-diagnostics";

describe("Next instrumentation request errors", () => {
  it("adapts the supported hook without retaining request headers", async () => {
    const onDiagnostic = vi.fn();
    const handler = createNextRequestErrorHandler(onDiagnostic);

    await handler(
      new Error("render exploded"),
      {
        path: "/dashboard?token=secret",
        method: "GET",
        headers: { authorization: "secret" },
      },
      {
        routerKind: "App Router",
        routePath: "/dashboard",
        routeType: "render",
      },
    );

    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "render",
        route: "/dashboard",
        message: "render exploded",
      }),
    );
    expect(onDiagnostic.mock.calls[0]?.[0]).not.toHaveProperty("headers");
    expect(onDiagnostic.mock.calls[0]?.[0]).not.toHaveProperty("method");
    expect(onDiagnostic.mock.calls[0]?.[0]?.route).not.toContain("token");
  });
});
