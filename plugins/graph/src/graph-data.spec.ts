import { describe, expect, it } from "vitest";
import { buildGraphData } from "./graph-data";

describe("graph data", () => {
	it("handles null", () => {
		const d = buildGraphData(null) as { status: string };
		expect(d.status).toBe("unavailable");
	});

	it("builds from snapshot", () => {
		const snap = {
			status: "available",
			data: {
				tree: [
					{
						id: "a",
						displayName: "A",
						kind: "component",
						hasState: true,
						parentId: null,
					},
				],
			},
		};
		const d = buildGraphData(snap) as { nodeCount: number; edgeCount: number };
		expect(d.nodeCount).toBe(1);
		expect(d.edgeCount).toBe(0);
	});
});
