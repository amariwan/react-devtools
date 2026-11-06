import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import { describe, expect, it } from "vitest";
import { createPanelGroups, flattenVisiblePanelGroups } from "./panel-catalog";

const panel = (
	id: string,
	order: number,
	category?: PanelDescriptor["category"],
): PanelDescriptor => ({
	id,
	title: id,
	order,
	...(category ? { category } : {}),
	load: () => null,
});

describe("panel catalog", () => {
	it("groups panels like the reference navigation", () => {
		const panels = [
			panel("network", 20),
			panel("components", 1),
			panel("agent-mcp", 50),
			panel("custom", 40, "advanced"),
		];
		const groups = createPanelGroups(panels, {
			hiddenPanels: [],
			hiddenPanelCategories: [],
			pinnedPanels: ["network", "components"],
		});

		expect(groups.map(({ name }) => name)).toEqual([
			"pinned",
			"app",
			"modules",
			"advanced",
		]);
		expect(groups[0]?.panels.map(({ id }) => id)).toEqual([
			"network",
			"components",
		]);
		expect(groups[3]?.panels.map(({ id }) => id)).toEqual([
			"custom",
			"agent-mcp",
		]);
	});

	it("filters hidden categories and panels for the rail", () => {
		const panels = [panel("components", 1), panel("network", 2)];
		const groups = createPanelGroups(panels, {
			hiddenPanels: ["network"],
			hiddenPanelCategories: ["app"],
			pinnedPanels: [],
		});

		expect(flattenVisiblePanelGroups(groups, ["network"])).toEqual([]);
	});
});
