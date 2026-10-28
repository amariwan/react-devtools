import { describe, expect, it } from "vitest";
import {
  createEditorRuntimeService,
  type EditorRequest,
} from "@next-devtools/source-inspector";

describe("editor runtime service", () => {
  it("stores editor preference and forwards exact locations", async () => {
    const calls: Parameters<EditorRequest>[] = [];
    const request: EditorRequest = async (...args) => {
      calls.push(args);
      return { ok: true };
    };
    const runtime = createEditorRuntimeService({
      endpoint: "/open",
      editor: "vscode",
      request,
    });
    runtime.setEditor("cursor");

    await expect(
      runtime.open({ path: "src/app.tsx", line: 7, column: 9 }),
    ).resolves.toEqual({ ok: true });

    expect(calls).toEqual([
      ["/open", { path: "src/app.tsx", line: 7, column: 9 }, "cursor"],
    ]);
    expect(runtime.getSnapshot().data.editor).toBe("cursor");
  });

  it.each([
    { path: "src/app.tsx", line: Number.NaN, column: 1 },
    { path: "src/app.tsx", line: Number.POSITIVE_INFINITY, column: 1 },
    { path: "src/app.tsx", line: 0, column: 1 },
    { path: "src/app.tsx", line: 1, column: 0 },
  ])(
    "rejects invalid numeric locations without a request",
    async (location) => {
      let calls = 0;
      const runtime = createEditorRuntimeService({
        endpoint: "/open",
        request: async () => {
          calls++;
          return { ok: true };
        },
      });

      await expect(runtime.open(location)).resolves.toEqual({
        ok: false,
        reason: "invalid_location",
      });
      expect(calls).toBe(0);
    },
  );

  it("exposes in-flight and failed request status", async () => {
    let resolve!: (result: { ok: false; reason: string }) => void;
    const pending = new Promise<{ ok: false; reason: string }>((next) => {
      resolve = next;
    });
    const runtime = createEditorRuntimeService({
      endpoint: "/open",
      request: () => pending,
    });

    const opening = runtime.open({ path: "src/app.tsx", line: 1, column: 1 });
    expect(runtime.getSnapshot().data.inFlight).toBe(true);
    resolve({ ok: false, reason: "editor unavailable" });
    await opening;

    expect(runtime.getSnapshot()).toMatchObject({
      status: "error",
      reason: "editor unavailable",
      data: {
        inFlight: false,
        lastResult: { ok: false, reason: "editor unavailable" },
      },
    });
  });

  it("allows repeated calls while tracking aggregate in-flight state", async () => {
    const resolvers: Array<() => void> = [];
    const runtime = createEditorRuntimeService({
      endpoint: "/open",
      request: () =>
        new Promise((resolve) => resolvers.push(() => resolve({ ok: true }))),
    });

    const first = runtime.open({ path: "src/one.tsx", line: 1, column: 1 });
    const second = runtime.open({ path: "src/two.tsx", line: 2, column: 2 });
    resolvers[0]?.();
    await first;
    expect(runtime.getSnapshot().data.inFlight).toBe(true);
    resolvers[1]?.();
    await second;
    expect(runtime.getSnapshot().data.inFlight).toBe(false);
  });
});
