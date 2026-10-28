import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { handleOpenInEditorRequest } from "@next-devtools/next/server";
import { openInEditorWithAuthorization } from "@next-devtools/host-next";

describe("open-in-editor security and integration", () => {
  it("rejects non-development environments via handler", async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const req = new Request("http://localhost:3000/api/open-in-editor", {
      method: "POST",
      body: JSON.stringify({ path: "src/app/page.tsx", line: 1, column: 1 }),
      headers: { "content-type": "application/json", host: "localhost:3000" },
    });
    const res = await handleOpenInEditorRequest(req);
    expect(res.status).toBe(404);
    process.env.NODE_ENV = original;
  });

  it("rejects unauthorized origins", async () => {
    process.env.NODE_ENV = "development";
    const req = new Request("http://localhost:3000/api/open-in-editor", {
      method: "POST",
      body: JSON.stringify({ path: "src/app/page.tsx", line: 1, column: 1 }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://evil.example",
      },
    });
    const res = await handleOpenInEditorRequest(req);
    expect(res.status).toBe(403);
  });

  it("rejects path traversal", async () => {
    process.env.NODE_ENV = "development";
    const req = new Request("http://localhost:3000/api/open-in-editor", {
      method: "POST",
      body: JSON.stringify({ path: "../../etc/passwd", line: 1, column: 1 }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    const res = await handleOpenInEditorRequest(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("ignores client-supplied filesystem roots", async () => {
    process.env.NODE_ENV = "development";
    const req = new Request("http://localhost:3000/api/open-in-editor", {
      method: "POST",
      body: JSON.stringify({
        path: "package.json",
        line: 1,
        column: 1,
        roots: ["/"],
      }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    const res = await handleOpenInEditorRequest(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("rejects invalid locations", async () => {
    process.env.NODE_ENV = "development";
    const req = new Request("http://localhost:3000/api/open-in-editor", {
      method: "POST",
      body: JSON.stringify({ path: "src/app/page.tsx", line: 0, column: 1 }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    const res = await handleOpenInEditorRequest(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("rejects disallowed editors", async () => {
    process.env.NODE_ENV = "development";
    const req = new Request("http://localhost:3000/api/open-in-editor", {
      method: "POST",
      body: JSON.stringify({
        path: "src/app/page.tsx",
        line: 1,
        column: 1,
        editor: "vim",
      }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    const res = await handleOpenInEditorRequest(req);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  it("mocks editor execution and verifies exact executable, file, line, and column", async () => {
    process.env.NODE_ENV = "development";
    const executor = vi.fn(async () => ({ ok: true }));
    const result = await openInEditorWithAuthorization(
      {
        path: "src/app/page.tsx",
        line: 7,
        column: 9,
        editor: "cursor",
      },
      executor,
      { validateRequestContext: async () => true },
    );
    expect(result).toEqual({ ok: true });
    expect(executor).toHaveBeenCalledOnce();
    const [file, line, column, editor] = executor.mock.calls[0];
    expect(file).toBe(path.resolve(process.cwd(), "src/app/page.tsx"));
    expect(line).toBe(7);
    expect(column).toBe(9);
    expect(editor).toBe("cursor");
  });

  it("fails closed when the request context cannot be verified", async () => {
    process.env.NODE_ENV = "development";
    const executor = vi.fn(async () => ({ ok: true }));
    const result = await openInEditorWithAuthorization(
      {
        path: "src/app/page.tsx",
        line: 7,
        column: 9,
        editor: "cursor",
      },
      executor,
      { validateRequestContext: async () => false },
    );
    expect(result).toEqual({ ok: false, reason: "unauthorized_origin" });
    expect(executor).not.toHaveBeenCalled();
  });
});
