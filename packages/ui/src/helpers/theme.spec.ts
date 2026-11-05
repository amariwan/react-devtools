import { describe, expect, it } from "vitest";
import { isTheme, readStoredTheme, resolveTheme } from "./theme";

describe("theme", () => {
	it("validates theme", () => {
		expect(isTheme("light")).toBe(true);
		expect(isTheme("dark")).toBe(true);
		expect(isTheme("nope")).toBe(false);
	});

	it("reads stored theme", () => {
		const storage = {
			getItem: (k: string) => (k === "ndt-theme" ? "dark" : null),
		};
		expect(readStoredTheme(storage)).toBe("dark");
		expect(readStoredTheme(null)).toBeNull();
	});

	it("resolves theme", () => {
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
	});
});
