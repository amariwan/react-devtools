/**
 * Shell preferences: persisted, validated, and independent of React.
 * Pure functions so behavior is unit-testable without a DOM.
 */

export type ThemePref = "light" | "dark" | "system";
export type DockPosition = "bottom" | "right" | "left";

export interface ShellPrefs {
  theme: ThemePref;
  dock: DockPosition;
  /** Panel ids the user has hidden from the navigation rail. */
  hiddenPanels: string[];
}

export const PREFS_STORAGE_KEY = "devtools.prefs";

const THEMES: readonly ThemePref[] = ["light", "dark", "system"];
const DOCKS: readonly DockPosition[] = ["bottom", "right", "left"];

export function defaultPrefs(): ShellPrefs {
  return { theme: "system", dock: "bottom", hiddenPanels: [] };
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
    const hiddenPanels = Array.isArray(parsed.hiddenPanels)
      ? parsed.hiddenPanels.filter((x): x is string => typeof x === "string")
      : base.hiddenPanels;
    return { theme, dock, hiddenPanels };
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
