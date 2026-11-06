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
			stylesheets: [
				":root { --color-primary: red; } [data-theme=dark] { --color-primary: blue; }",
			],
			declarations: [
				{
					name: "--color-primary",
					selector: ":root",
					source: "app.css",
					value: "red",
				},
				{
					name: "--color-primary",
					selector: "[data-theme=dark]",
					source: "theme.css",
					value: "blue",
				},
			],
		});
		expect(d.tokens).toEqual([
			{
				name: "--color-primary",
				declarations: [
					{ selector: ":root", source: "app.css", value: "red" },
					{
						selector: "[data-theme=dark]",
						source: "theme.css",
						value: "blue",
					},
				],
			},
		]);
	});
});
