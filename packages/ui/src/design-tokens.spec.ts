import { readFileSync } from "node:fs";
import {
	DARK_COLORS,
	DARK_STATUS_COLORS,
	FONT_FAMILY,
	GEOMETRY,
	LIGHT_COLORS,
	LIGHT_STATUS_COLORS,
	SPACE_UNIT,
	TYPOGRAPHY,
	getColorTokens,
	getStatusColors,
} from "@next-devtools/ui";
import {
	THEME_STORAGE_KEYS,
	isTheme,
	readStoredTheme,
	resolveDomTheme,
	resolveTheme,
} from "@next-devtools/ui";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
	new URL("./css/devtools.css", import.meta.url),
	"utf8",
);
const contrastPairs = [
	["foreground", "background"],
	["card-foreground", "card"],
	["popover-foreground", "popover"],
	["secondary-foreground", "secondary"],
	["muted-foreground", "muted"],
	["accent-foreground", "accent"],
	["primary-foreground", "primary"],
	["destructive-foreground", "destructive"],
	["success-foreground", "success"],
	["warning-foreground", "warning"],
	["info-foreground", "info"],
] as const;

function themeTokens(name: "light" | "dark"): Record<string, string> {
	const start =
		name === "light"
			? stylesheet.indexOf(":host {")
			: stylesheet.indexOf(':host([data-theme="dark"])');
	const end =
		name === "light"
			? stylesheet.indexOf(':host([data-theme="dark"])')
			: stylesheet.indexOf("@theme inline");
	const declarations = stylesheet.slice(start, end);
	return Object.fromEntries(
		[...declarations.matchAll(/--([\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map(
			([, token, value]) => [token, value],
		),
	);
}

function contrastRatio(foreground: string, background: string): number {
	const luminance = (hex: string) => {
		const channels = [1, 3, 5].map(
			(offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
		);
		const linear = channels.map((channel) =>
			channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
		);
		return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
	};
	const fg = luminance(foreground);
	const bg = luminance(background);
	return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

describe("design tokens", () => {
	it("exposes light and dark color tables with identical roles", () => {
		const lightRoles = Object.keys(LIGHT_COLORS).sort();
		const darkRoles = Object.keys(DARK_COLORS).sort();
		expect(lightRoles).toEqual(darkRoles);
		expect(lightRoles.length).toBeGreaterThan(0);
	});

	it("exposes light and dark status tables with identical tones", () => {
		const light = Object.keys(LIGHT_STATUS_COLORS).sort();
		const dark = Object.keys(DARK_STATUS_COLORS).sort();
		expect(light).toEqual(dark);
	});

	it("contains non-empty color strings for every role", () => {
		for (const value of Object.values(LIGHT_COLORS)) {
			expect(value.length).toBeGreaterThan(0);
		}
		for (const value of Object.values(DARK_COLORS)) {
			expect(value.length).toBeGreaterThan(0);
		}
	});

	it("keeps the accent-selection fill stable across themes", () => {
		expect(DARK_COLORS.accentSelected).toBe(LIGHT_COLORS.accentSelected);
		expect(LIGHT_COLORS.onAccent).toBe("#ffffff");
	});

	it("selects the correct table for a theme", () => {
		expect(getColorTokens("light")).toBe(LIGHT_COLORS);
		expect(getColorTokens("dark")).toBe(DARK_COLORS);
		expect(getStatusColors("light")).toBe(LIGHT_STATUS_COLORS);
		expect(getStatusColors("dark")).toBe(DARK_STATUS_COLORS);
	});

	it("uses a 4px base spacing unit and positive geometry values", () => {
		expect(SPACE_UNIT).toBe(4);
		for (const value of Object.values(GEOMETRY)) {
			expect(value).toBeGreaterThan(0);
		}
	});

	it("defines isolated sans and mono font stacks", () => {
		expect(FONT_FAMILY.sans).toContain("ui-sans-serif");
		expect(FONT_FAMILY.mono).toContain("ui-monospace");
		expect(TYPOGRAPHY.fontSizeDefault).toBe(14);
	});

	it("keeps semantic text and status pairs at WCAG AA contrast", () => {
		for (const theme of ["light", "dark"] as const) {
			const tokens = themeTokens(theme);
			for (const [foreground, background] of contrastPairs) {
				expect(
					contrastRatio(tokens[foreground] ?? "", tokens[background] ?? ""),
					`${theme} ${foreground} on ${background}`,
				).toBeGreaterThanOrEqual(4.5);
			}
		}
	});
});

describe("theme resolution", () => {
	const storage = (entries: Record<string, string>): Storage => {
		const map = new Map(Object.entries(entries));
		return {
			getItem: (key: string) => map.get(key) ?? null,
		} as Storage;
	};

	it("validates theme values strictly", () => {
		expect(isTheme("light")).toBe(true);
		expect(isTheme("dark")).toBe(true);
		expect(isTheme("auto")).toBe(false);
		expect(isTheme(null)).toBe(false);
		expect(isTheme(undefined)).toBe(false);
		expect(isTheme("")).toBe(false);
	});

	it("reads the devtools-canonical key after the host key", () => {
		expect(THEME_STORAGE_KEYS).toEqual(["theme", "ndt-theme"]);
		expect(readStoredTheme(storage({ ndt: "dark", theme: "light" }))).toBe(
			"light",
		);
		expect(readStoredTheme(storage({ "ndt-theme": "dark" }))).toBe("dark");
	});

	it("ignores invalid stored values and falls through keys", () => {
		expect(
			readStoredTheme(storage({ theme: "auto", "ndt-theme": "dark" })),
		).toBe("dark");
		expect(readStoredTheme(storage({ theme: "bogus" }))).toBeNull();
		expect(readStoredTheme(null)).toBeNull();
	});

	it("prefers stored theme over the system scheme and fallback", () => {
		expect(
			resolveTheme({
				storage: storage({ "ndt-theme": "dark" }),
				matchesDarkScheme: () => false,
				fallback: "light",
			}),
		).toBe("dark");
	});

	it("falls back to the system scheme, then the explicit fallback", () => {
		expect(resolveTheme({ storage: null, matchesDarkScheme: () => true })).toBe(
			"dark",
		);
		expect(
			resolveTheme({
				storage: null,
				matchesDarkScheme: () => false,
				fallback: "light",
			}),
		).toBe("light");
		expect(resolveTheme({})).toBe("light");
	});

	it("returns light when the DOM is unavailable", () => {
		expect(resolveDomTheme()).toBe("light");
	});
});
