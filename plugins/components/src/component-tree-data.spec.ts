import { describe, expect, it } from "vitest";
import {
	filterComponentRows,
	flattenComponentTree,
	formatInspectorValue,
	formatSourceLocation,
} from "./component-tree-data";

describe("component tree data", () => {
	it("flattens empty tree", () => {
		expect(flattenComponentTree([] as never)).toHaveLength(0);
	});

	it("flattens nested tree", () => {
		const nodes = [
			{ id: "a", displayName: "A", parentId: null, childIds: ["b"] },
			{ id: "b", displayName: "B", parentId: "a", childIds: [] },
		];
		const rows = flattenComponentTree(nodes as never);
		expect(rows).toHaveLength(2);
		expect(rows[1].depth).toBe(1);
	});

	it("promotes orphan nodes", () => {
		const nodes = [
			{ id: "b", displayName: "B", parentId: "missing", childIds: [] },
		];
		const rows = flattenComponentTree(nodes as never);
		expect(rows).toHaveLength(1);
	});

	it("filters rows by query", () => {
		const nodes = [
			{ id: "a", displayName: "Apple", parentId: null, childIds: [] },
			{ id: "b", displayName: "Banana", parentId: null, childIds: [] },
		];
		const rows = flattenComponentTree(nodes as never);
		const filtered = filterComponentRows(rows, "app");
		expect(filtered).toHaveLength(1);
		expect(filterComponentRows(rows, "")).toHaveLength(2);
	});

	it("formats source location", () => {
		expect(formatSourceLocation({ file: "a.ts", line: 1, column: 2 })).toBe(
			"a.ts:1:2",
		);
		expect(formatSourceLocation({ file: "a.ts", line: 1 })).toBe("a.ts:1");
		expect(formatSourceLocation({ file: "a.ts" })).toBe("a.ts");
		expect(formatSourceLocation(null)).toBeNull();
	});

	it("formats inspector value", () => {
		expect(formatInspectorValue(undefined)).toBe("undefined");
		expect(formatInspectorValue("hi")).toBe("hi");
		expect(formatInspectorValue({ a: 1 })).toContain("a");
	});
});
