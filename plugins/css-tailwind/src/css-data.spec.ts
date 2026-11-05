import { describe, expect, it } from "vitest";
import { buildCssData } from "./css-data";

describe("css data", () => {
	it("detects tailwind", () => {
		const d = buildCssData({
			stylesheets: ["/* tailwindcss */\n.flex{display:flex}"],
		});
		expect(d.tailwindDetected).toBe(true);
		expect(d.ruleCount).toBeGreaterThan(0);
	});

	it("handles null", () => {
		const d = buildCssData(null);
		expect(d.tailwindDetected).toBe(false);
		expect(d.tokens).toHaveLength(0);
	});

	it("extracts tokens", () => {
		const d = buildCssData({
			stylesheets: [":root { --color-primary: red; }"],
		});
		expect(d.tokens).toContain("--color-primary");
	});
});
