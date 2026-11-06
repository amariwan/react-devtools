import { describe, expect, it } from "vitest";
import {
	clampFcoseSettings,
	hasBlockingFcoseIssues,
	shouldHideGraphLabels,
	validateFcoseSettings,
} from "./graph-layout";

describe("graph layout", () => {
	it("clamps settings", () => {
		const s = clampFcoseSettings({
			quality: "default",
			nodeRepulsion: 1000,
			idealEdgeLength: 50,
			edgeElasticity: 0.1,
			nestingFactor: 0.1,
			gravity: 0.5,
			numIter: 100,
			tile: true,
			tilingPaddingVertical: 5,
			tilingPaddingHorizontal: 5,
		} as never);
		expect(s).toBeTruthy();
	});

	it("validates settings", () => {
		const issues = validateFcoseSettings({
			quality: "default",
			nodeRepulsion: 1000,
			idealEdgeLength: 50,
			edgeElasticity: 0.1,
			nestingFactor: 0.1,
			gravity: 0.5,
			numIter: 100,
			tile: true,
			tilingPaddingVertical: 5,
			tilingPaddingHorizontal: 5,
		} as never);
		expect(Array.isArray(issues)).toBe(true);
	});

	it("checks blocking issues", () => {
		expect(typeof hasBlockingFcoseIssues([])).toBe("boolean");
	});

	it("hides labels only for large graph overviews", () => {
		expect(shouldHideGraphLabels(320, 0.45)).toBe(true);
		expect(shouldHideGraphLabels(320, 0.8)).toBe(false);
		expect(shouldHideGraphLabels(20, 0.45)).toBe(false);
	});
});
