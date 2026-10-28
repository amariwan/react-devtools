import { describe, expect, it } from "vitest";
import {
  defaultPrefs,
  isDockPosition,
  isThemePref,
  loadPrefs,
  PREFS_STORAGE_KEY,
  resolveEffectiveTheme,
  savePrefs,
  type ShellPrefs,
} from "@next-devtools/ui";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

describe("prefs defaults and validation", () => {
  it("provides sensible defaults", () => {
    expect(defaultPrefs()).toEqual({
      theme: "system",
      dock: "bottom",
      hiddenPanels: [],
    });
  });

  it("validates theme and dock values strictly", () => {
    expect(isThemePref("light")).toBe(true);
    expect(isThemePref("dark")).toBe(true);
    expect(isThemePref("system")).toBe(true);
    expect(isThemePref("auto")).toBe(false);
    expect(isDockPosition("bottom")).toBe(true);
    expect(isDockPosition("right")).toBe(true);
    expect(isDockPosition("top")).toBe(false);
  });
});

describe("loadPrefs", () => {
  it("returns defaults for missing or null storage", () => {
    expect(loadPrefs(null)).toEqual(defaultPrefs());
    expect(loadPrefs(memoryStorage())).toEqual(defaultPrefs());
  });

  it("reads persisted values", () => {
    const storage = memoryStorage({
      [PREFS_STORAGE_KEY]: JSON.stringify({
        theme: "dark",
        dock: "right",
        hiddenPanels: ["graph", "network"],
      }),
    });
    expect(loadPrefs(storage)).toEqual({
      theme: "dark",
      dock: "right",
      hiddenPanels: ["graph", "network"],
    });
  });

  it("falls back to defaults for invalid or corrupt values", () => {
    const corrupt = memoryStorage({ [PREFS_STORAGE_KEY]: "{not json" });
    expect(loadPrefs(corrupt)).toEqual(defaultPrefs());

    const invalid = memoryStorage({
      [PREFS_STORAGE_KEY]: JSON.stringify({ theme: "auto", dock: "top" }),
    });
    expect(loadPrefs(invalid)).toEqual(defaultPrefs());

    const badPanels = memoryStorage({
      [PREFS_STORAGE_KEY]: JSON.stringify({ hiddenPanels: [1, 2, "x", null] }),
    });
    expect(loadPrefs(badPanels).hiddenPanels).toEqual(["x"]);
  });
});

describe("savePrefs", () => {
  it("round-trips through the storage key", () => {
    const storage = memoryStorage();
    const prefs: ShellPrefs = {
      theme: "light",
      dock: "left",
      hiddenPanels: ["agent-mcp"],
    };
    savePrefs(storage, prefs);
    expect(loadPrefs(storage)).toEqual(prefs);
  });
});

describe("resolveEffectiveTheme", () => {
  it("resolves system to the provided scheme", () => {
    expect(resolveEffectiveTheme("system", true)).toBe("dark");
    expect(resolveEffectiveTheme("system", false)).toBe("light");
  });

  it("passes explicit themes through unchanged", () => {
    expect(resolveEffectiveTheme("light", true)).toBe("light");
    expect(resolveEffectiveTheme("dark", false)).toBe("dark");
  });
});
