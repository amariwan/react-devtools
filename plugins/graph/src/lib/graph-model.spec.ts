import { describe, expect, it } from "vitest";
import {
	createDefaultEdgeFilters,
	createDefaultNodeFilters,
	isDependencyEdgeKind,
	isDependencyNodeKind,
	nodeKindLabel,
} from "./graph-model";

describe("graph model", () => {
	it("creates default filters", () => {
		expect(createDefaultNodeFilters().size).toBeGreaterThan(0);
		expect(createDefaultEdgeFilters().size).toBeGreaterThan(0);
	});

	it("validates kinds", () => {
		expect(isDependencyNodeKind("component")).toBe(true);
		expect(isDependencyNodeKind("nope")).toBe(false);
		expect(isDependencyEdgeKind("reads")).toBe(true);
		expect(isDependencyEdgeKind("nope")).toBe(false);
	});

	it("labels kinds", () => {
		expect(typeof nodeKindLabel("component")).toBe("string");
	});
});
