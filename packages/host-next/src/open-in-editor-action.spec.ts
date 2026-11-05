import { describe, expect, it } from "vitest";
import { openInEditorWithAuthorization } from "./open-in-editor-action";

describe("open in editor action", () => {
	it("rejects in production", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";
		const r = await openInEditorWithAuthorization({
			path: "a.ts",
			line: 1,
			column: 1,
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("not_development");
		process.env.NODE_ENV = prev;
	});

	it("rejects invalid input in dev", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization({ path: 123 });
		expect(r.ok).toBe(false);
		process.env.NODE_ENV = prev;
	});

	it("rejects invalid line", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization(
			{ path: "a.ts", line: 0 },
			async () => ({ ok: true }),
			{ validateRequestContext: async () => true },
		);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("invalid_line");
		process.env.NODE_ENV = prev;
	});

	it("rejects invalid column", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization(
			{ path: "a.ts", line: 1, column: 0 },
			async () => ({ ok: true }),
			{ validateRequestContext: async () => true },
		);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("invalid_column");
		process.env.NODE_ENV = prev;
	});

	it("rejects bad editor", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization(
			{ path: "a.ts", line: 1, editor: "vim" },
			async () => ({ ok: true }),
			{ validateRequestContext: async () => true },
		);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("editor_not_allowed");
		process.env.NODE_ENV = prev;
	});

	it("rejects unauthorized origin", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization(
			{ path: "a.ts", line: 1 },
			async () => ({ ok: true }),
			{ validateRequestContext: async () => false },
		);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("unauthorized_origin");
		process.env.NODE_ENV = prev;
	});

	it("executes with executor", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization(
			{ path: "a.ts", line: 1, column: 2, editor: "vscode" },
			async () => ({ ok: true }),
			{ validateRequestContext: async () => true },
		);
		expect(r.ok).toBe(true);
		process.env.NODE_ENV = prev;
	});

	it("propagates executor failure", async () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "development";
		const r = await openInEditorWithAuthorization(
			{ path: "a.ts", line: 1 },
			async () => ({ ok: false, reason: "boom" }),
			{ validateRequestContext: async () => true },
		);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("boom");
		process.env.NODE_ENV = prev;
	});
});
