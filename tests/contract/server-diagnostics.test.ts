import { describe, expect, it, vi } from "vitest";
import {
  normalizeRequestError,
  wrapServerRequest,
} from "../../packages/host-next/src/server-diagnostics";

describe("server diagnostics", () => {
  it("normalizes route context without exposing request payloads", () => {
    const diagnostic = normalizeRequestError(new Error("render failed"), {
      kind: "render",
      path: "/dashboard",
    });

    expect(diagnostic).toEqual(
      expect.objectContaining({
        kind: "render",
        message: "render failed",
        route: "/dashboard",
      }),
    );
    expect(diagnostic).not.toHaveProperty("args");
  });

  it("reports and rethrows the original server exception", async () => {
    const onDiagnostic = vi.fn();
    const error = new Error("upstream unavailable");
    const request = wrapServerRequest(
      async () => {
        throw error;
      },
      { kind: "route", route: "/api/data" },
      onDiagnostic,
    );

    await expect(request()).rejects.toBe(error);
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "route",
        route: "/api/data",
        message: "upstream unavailable",
      }),
    );
  });
});
