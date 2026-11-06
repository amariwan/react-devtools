import { describe, expect, it } from "vitest";
import { buildUniversalSearchEntries } from "./universal-search";

describe("universal search", () => {
	it("builds entries", () => {
		const entries = buildUniversalSearchEntries({} as never);
		expect(Array.isArray(entries)).toBe(true);
	});

	it("keeps runtime categories searchable when a snapshot is large", () => {
		const entries = buildUniversalSearchEntries(
			{
				routes: {
					tree: {
						nodes: Array.from({ length: 300 }, (_, index) => ({
							id: `route-${index}`,
							name: `Route ${index}`,
						})),
					},
				},
				timeline: {
					events: [
						{ id: "navigation-1", layer: "navigation", type: "navigation" },
					],
				},
				react: {
					tree: Array.from({ length: 300 }, (_, index) => ({
						id: `component-${index}`,
						displayName: `Component ${index}`,
					})),
				},
			},
			3,
		);

		expect(entries.map((entry) => entry.kind)).toEqual([
			"route",
			"timeline",
			"component",
		]);
	});

	it("prioritizes recent timeline events within the result limit", () => {
		const entries = buildUniversalSearchEntries(
			{
				timeline: {
					events: [
						{ id: "old", layer: "navigation", type: "navigation" },
						{ id: "recent", layer: "navigation", type: "navigation" },
					],
				},
			},
			1,
		);

		expect(entries[0]?.id).toBe("timeline:recent");
	});
});
