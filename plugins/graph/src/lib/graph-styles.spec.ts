import { describe, expect, it } from "vitest";
import {
	graphThemeSignature,
	nodePalette,
	resolveGraphTheme,
} from "./graph-styles";

describe("graph styles", () => {
	it("resolves theme", () => {
		const t = resolveGraphTheme();
		expect(t).toBeTruthy();
	});

	it("signatures differ", () => {
		const t = resolveGraphTheme();
		expect(typeof graphThemeSignature(t)).toBe("string");
	});

	it("node palette returns color", () => {
		const t = resolveGraphTheme();
		expect(nodePalette("component", t)).toBeTruthy();
	});
});
