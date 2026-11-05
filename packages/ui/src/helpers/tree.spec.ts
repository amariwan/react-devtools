import { describe, expect, it } from "vitest";
import { flattenTree, toggleExpanded } from "./tree";

describe("tree", () => {
	it("flattens top-level nodes", () => {
		const nodes = [{ id: "a" }, { id: "b" }];
		const rows = flattenTree(nodes);
		expect(rows).toHaveLength(2);
		expect(rows[0].node.id).toBe("a");
	});

	it("toggles expansion", () => {
		const s = new Set<string>();
		const next = toggleExpanded(s, "a");
		expect(next.has("a")).toBe(true);
		expect(toggleExpanded(next, "a").has("a")).toBe(false);
	});

	it("expands children when expanded", () => {
		const nodes = [{ id: "a", children: [{ id: "b" }] }];
		const rows = flattenTree(nodes, new Set(["a"]));
		expect(rows.map((r) => r.node.id)).toEqual(["a", "b"]);
	});
});
