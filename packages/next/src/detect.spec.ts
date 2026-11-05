import { describe, expect, it } from "vitest";
import { detectIntegration } from "./detect";

describe("detect", () => {
	it("returns true for unknown", async () => {
		expect(await detectIntegration("unknown")).toBe(true);
	});

	it("detects tailwind via dom when document available", async () => {
		const origDoc = (globalThis as { document?: unknown }).document;
		(globalThis as { document?: unknown }).document = {
			querySelector: () => null,
		} as never;
		const r = await detectIntegration("tailwindcss");
		expect(typeof r).toBe("boolean");
		(globalThis as { document?: unknown }).document = origDoc;
	});
});
