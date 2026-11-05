import { describe, expect, it } from "vitest";
import {
	defaultPrefs,
	isDockPosition,
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
			hiddenPanels: [],
		});
	});

	it("validates theme/dock", () => {
		expect(isThemePref("dark")).toBe(true);
		expect(isThemePref("nope")).toBe(false);
		expect(isDockPosition("left")).toBe(true);
		expect(isDockPosition("nope")).toBe(false);
	});

	it("loads from storage", () => {
		const storage = {
			getItem: () =>
				JSON.stringify({ theme: "dark", dock: "right", hiddenPanels: ["a"] }),
		};
		expect(loadPrefs(storage)).toEqual({
			theme: "dark",
			dock: "right",
			hiddenPanels: ["a"],
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
