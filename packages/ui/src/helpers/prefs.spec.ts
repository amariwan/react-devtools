import { describe, expect, it } from "vitest";
import {
	defaultPrefs,
	isDockPosition,
	isDockSize,
	isThemePref,
	loadPrefs,
	resolveEffectiveTheme,
	savePrefs,
} from "./prefs";

describe("prefs", () => {
	it("defaults", () => {
		expect(defaultPrefs()).toEqual({
			theme: "system",
			dock: "bottom",
			dockSize: 80,
			expandSidebar: false,
			scrollableSidebar: true,
			uiScale: 1,
			hiddenPanels: [],
			hiddenPanelCategories: [],
			pinnedPanels: [],
			highlightUpdates: false,
		});
	});

	it("validates theme/dock/dock size", () => {
		expect(isThemePref("dark")).toBe(true);
		expect(isThemePref("nope")).toBe(false);
		expect(isDockPosition("left")).toBe(true);
		expect(isDockPosition("nope")).toBe(false);
		expect(isDockSize(80)).toBe(true);
		expect(isDockSize(35)).toBe(true);
		expect(isDockSize(94)).toBe(true);
		expect(isDockSize(34)).toBe(false);
		expect(isDockSize(95)).toBe(false);
		expect(isDockSize("80")).toBe(false);
	});

	it("loads from storage", () => {
		const storage = {
			getItem: () =>
				JSON.stringify({
					theme: "dark",
					dock: "right",
					dockSize: 50,
					expandSidebar: true,
					scrollableSidebar: false,
					uiScale: 1,
					hiddenPanels: ["a"],
				}),
		};
		expect(loadPrefs(storage)).toEqual({
			theme: "dark",
			dock: "right",
			dockSize: 50,
			expandSidebar: true,
			scrollableSidebar: false,
			uiScale: 1,
			hiddenPanels: ["a"],
			hiddenPanelCategories: [],
			pinnedPanels: [],
			highlightUpdates: false,
		});
	});

	it("loads reference navigation preferences", () => {
		const storage = {
			getItem: () =>
				JSON.stringify({
					hiddenPanelCategories: ["modules", "unknown"],
					pinnedPanels: ["components", 42],
					highlightUpdates: true,
				}),
		};

		expect(loadPrefs(storage)).toMatchObject({
			hiddenPanelCategories: ["modules"],
			pinnedPanels: ["components"],
			highlightUpdates: true,
		});
	});

	it("falls back on invalid storage", () => {
		const storage = { getItem: () => "{bad" };
		expect(loadPrefs(storage)).toEqual(defaultPrefs());
	});

	it("resolves effective theme", () => {
		expect(resolveEffectiveTheme("system", true)).toBe("dark");
		expect(resolveEffectiveTheme("light", true)).toBe("light");
	});

	it("saves prefs", () => {
		let saved = "";
		savePrefs(
			{
				setItem: (_k, v) => {
					saved = v;
				},
			},
			defaultPrefs(),
		);
		expect(JSON.parse(saved)).toEqual(defaultPrefs());
	});
});
