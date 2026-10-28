import { describe, expect, it } from "vitest";
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
