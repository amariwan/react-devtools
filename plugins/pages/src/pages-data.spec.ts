import { describe, expect, it } from "vitest";
import { buildPagesData } from "./pages-data";

describe("pages data", () => {
	it("handles null", () => {
		const d = buildPagesData(null);
		expect(d.status).toBe("unavailable");
		expect(d.pages).toHaveLength(0);
	});
});
