/**
 * Shell preferences: persisted, validated, and independent of React.
 * Pure functions so behavior is unit-testable without a DOM.
 */

export type ThemePref = "light" | "dark" | "system";
export type DockPosition = "bottom" | "right" | "left";
export type PanelCategory = "app" | "modules" | "advanced";

/** Default docked DevTools width as a percentage of the viewport. */
export const DEFAULT_DOCK_SIZE = 80;
const MIN_DOCK_SIZE = 35;
const MAX_DOCK_SIZE = 94;

export interface ShellPrefs {
	theme: ThemePref;
	dock: DockPosition;
	/** Docked DevTools width as a percentage of the viewport. */
	dockSize: number;
	/** Keep the reference-style expanded navigation rail visible. */
	expandSidebar: boolean;
	/** Allow the navigation rail to scroll when panels exceed its height. */
	scrollableSidebar: boolean;
	/** Scale the complete DevTools surface, matching the reference density presets. */
	uiScale: number;
	/** Panel ids the user has hidden from the navigation rail. */
	hiddenPanels: string[];
	/** Navigation categories hidden from the reference-style settings. */
	hiddenPanelCategories: PanelCategory[];
	/** Panel ids pinned to the top of the navigation rail. */
	pinnedPanels: string[];
	/** Highlight component rows whose serialized runtime data changed. */
	highlightUpdates: boolean;
}

export const PREFS_STORAGE_KEY = "devtools.prefs";

const THEMES: readonly ThemePref[] = ["light", "dark", "system"];
const DOCKS: readonly DockPosition[] = ["bottom", "right", "left"];
const PANEL_CATEGORIES: readonly PanelCategory[] = [
	"app",
	"modules",
	"advanced",
];
export const UI_SCALE_OPTIONS = [0.8, 14 / 15, 1, 16 / 15, 1.2] as const;

export function defaultPrefs(): ShellPrefs {
	return {
		theme: "system",
		dock: "bottom",
		dockSize: DEFAULT_DOCK_SIZE,
		expandSidebar: false,
		scrollableSidebar: true,
		uiScale: 1,
		hiddenPanels: [],
		hiddenPanelCategories: [],
		pinnedPanels: [],
		highlightUpdates: false,
	};
}

export function isThemePref(value: unknown): value is ThemePref {
	return (
		typeof value === "string" && (THEMES as readonly string[]).includes(value)
	);
}

export function isDockPosition(value: unknown): value is DockPosition {
	return (
		typeof value === "string" && (DOCKS as readonly string[]).includes(value)
	);
}

export function isDockSize(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= MIN_DOCK_SIZE &&
		value <= MAX_DOCK_SIZE
	);
}

export function isUiScale(value: unknown): value is number {
	return (
		typeof value === "number" &&
		UI_SCALE_OPTIONS.some((option) => Math.abs(option - value) < Number.EPSILON)
	);
}

export function isPanelCategory(value: unknown): value is PanelCategory {
	return (
		typeof value === "string" &&
		(PANEL_CATEGORIES as readonly string[]).includes(value)
	);
}

export interface PrefStorage {
	getItem(key: string): string | null;
}

export function loadPrefs(storage: PrefStorage | null): ShellPrefs {
	const base = defaultPrefs();
	if (!storage) return base;
	const raw = storage.getItem(PREFS_STORAGE_KEY);
	if (!raw) return base;
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		const theme = isThemePref(parsed.theme) ? parsed.theme : base.theme;
		const dock = isDockPosition(parsed.dock) ? parsed.dock : base.dock;
		const dockSize = isDockSize(parsed.dockSize) ? parsed.dockSize : base.dockSize;
		const expandSidebar =
			typeof parsed.expandSidebar === "boolean"
				? parsed.expandSidebar
				: base.expandSidebar;
		const scrollableSidebar =
			typeof parsed.scrollableSidebar === "boolean"
				? parsed.scrollableSidebar
				: base.scrollableSidebar;
		const uiScale = isUiScale(parsed.uiScale) ? parsed.uiScale : base.uiScale;
		const hiddenPanels = Array.isArray(parsed.hiddenPanels)
			? parsed.hiddenPanels.filter((x): x is string => typeof x === "string")
			: base.hiddenPanels;
		const hiddenPanelCategories = Array.isArray(parsed.hiddenPanelCategories)
			? parsed.hiddenPanelCategories.filter(isPanelCategory)
			: base.hiddenPanelCategories;
		const pinnedPanels = Array.isArray(parsed.pinnedPanels)
			? parsed.pinnedPanels.filter((x): x is string => typeof x === "string")
			: base.pinnedPanels;
		const highlightUpdates =
			typeof parsed.highlightUpdates === "boolean"
				? parsed.highlightUpdates
				: base.highlightUpdates;
		return {
			theme,
			dock,
			dockSize,
			expandSidebar,
			scrollableSidebar,
			uiScale,
			hiddenPanels,
			hiddenPanelCategories,
			pinnedPanels,
			highlightUpdates,
		};
	} catch {
		return base;
	}
}

export function savePrefs(
	storage: { setItem(key: string, value: string): void },
	prefs: ShellPrefs,
): void {
	storage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

/** Resolve a `system` preference into a concrete theme given the OS scheme. */
export function resolveEffectiveTheme(
	pref: ThemePref,
	isSystemDark: boolean,
): "light" | "dark" {
	if (pref === "system") return isSystemDark ? "dark" : "light";
	return pref;
}
