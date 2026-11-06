import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import type { PanelCategory, ShellPrefs } from "./prefs.js";

export type PanelCategoryName = "pinned" | PanelCategory;

export const PANEL_CATEGORY_ORDER: readonly PanelCategoryName[] = [
	"pinned",
	"app",
	"modules",
	"advanced",
];

const APP_PANEL_IDS = new Set([
	"overview",
	"components",
	"pages",
	"graph",
	"timeline",
]);
const APP_PANEL_ORDER = [
	"overview",
	"components",
	"graph",
	"pages",
	"timeline",
];

export function getPanelCategory(panel: PanelDescriptor): PanelCategory {
	if (panel.category) return panel.category;
	if (APP_PANEL_IDS.has(panel.id)) return "app";
	if (panel.id === "agent-mcp") return "advanced";
	return "modules";
}

export interface PanelGroup {
	name: PanelCategoryName;
	panels: PanelDescriptor[];
	hidden: boolean;
}

export function createPanelGroups(
	panels: readonly PanelDescriptor[],
	prefs: Pick<
		ShellPrefs,
		"hiddenPanels" | "hiddenPanelCategories" | "pinnedPanels"
	>,
): PanelGroup[] {
	const hiddenPanelCategories = prefs.hiddenPanelCategories ?? [];
	const pinnedPanels = prefs.pinnedPanels ?? [];
	const groups = new Map<PanelCategoryName, PanelDescriptor[]>(
		PANEL_CATEGORY_ORDER.map((name) => [name, []]),
	);

	for (const panel of panels) {
		const category = pinnedPanels.includes(panel.id)
			? "pinned"
			: getPanelCategory(panel);
		groups.get(category)?.push(panel);
	}

	const pinned = groups.get("pinned") ?? [];
	pinned.sort(
		(a, b) => pinnedPanels.indexOf(a.id) - pinnedPanels.indexOf(b.id),
	);

	for (const category of ["app", "modules", "advanced"] as const) {
		groups.get(category)?.sort((a, b) => {
			if (category === "app") {
				const aReferenceOrder = APP_PANEL_ORDER.indexOf(a.id);
				const bReferenceOrder = APP_PANEL_ORDER.indexOf(b.id);
				if (aReferenceOrder !== bReferenceOrder) {
					return (
						(aReferenceOrder < 0 ? Number.MAX_SAFE_INTEGER : aReferenceOrder) -
						(bReferenceOrder < 0 ? Number.MAX_SAFE_INTEGER : bReferenceOrder)
					);
				}
			}
			return (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title);
		});
	}

	return PANEL_CATEGORY_ORDER.map((name) => {
		const categoryPanels = groups.get(name) ?? [];
		const hidden = name !== "pinned" && hiddenPanelCategories.includes(name);
		return { name, panels: categoryPanels, hidden };
	});
}

export function flattenVisiblePanelGroups(
	groups: readonly PanelGroup[],
	hiddenPanels: readonly string[] = [],
): PanelDescriptor[] {
	return groups.flatMap(({ panels, hidden, name }) =>
		(name === "pinned" || !hidden ? panels : []).filter(
			(panel) => !hiddenPanels.includes(panel.id),
		),
	);
}
