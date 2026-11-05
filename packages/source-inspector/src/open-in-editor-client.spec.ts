import { describe, expect, it, vi } from "vitest";
import {
	isValidEditorLocation,
	requestOpenInEditor,
} from "./open-in-editor-client";

describe("open in editor client", () => {
	it("validates location", () => {
		expect(isValidEditorLocation({ path: "a.ts", line: 1, column: 1 })).toBe(
			true,
		);
		expect(isValidEditorLocation({ path: "", line: 1, column: 1 })).toBe(false);
		expect(isValidEditorLocation({ path: "a.ts", line: 0, column: 1 })).toBe(
			false,
		);
	});

	it("returns invalid_location for bad input", async () => {
		const r = await requestOpenInEditor("/api", {
			path: "",
			line: 1,
			column: 1,
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("invalid_location");
	});

	it("returns ok on success", async () => {
		vi.stubGlobal("fetch", async () => ({
			json: async () => ({ ok: true }),
		}));
		const r = await requestOpenInEditor("/api", {
			path: "a.ts",
			line: 1,
			column: 1,
		});
		expect(r.ok).toBe(true);
		vi.unstubAllGlobals();
	});

	it("returns reason on failure", async () => {
		vi.stubGlobal("fetch", async () => ({
			json: async () => ({ ok: false, reason: "nope" }),
		}));
		const r = await requestOpenInEditor("/api", {
			path: "a.ts",
			line: 1,
			column: 1,
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("nope");
		vi.unstubAllGlobals();
	});

	it("handles fetch error", async () => {
		vi.stubGlobal("fetch", async () => {
			throw new Error("net");
		});
		const r = await requestOpenInEditor("/api", {
			path: "a.ts",
			line: 1,
			column: 1,
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("net");
		vi.unstubAllGlobals();
	});
});
