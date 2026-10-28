/**
 * Theme resolution helpers.
 *
 * Pure functions so theme behavior is unit-testable without a DOM. The shell
 * calls {@link resolveDomTheme} once at mount and applies the result.
 */

import type { Theme } from "./tokens.js";

/** Storage keys consulted in order. `ndt-theme` is the DevTools-canonical key. */
export const THEME_STORAGE_KEYS = ["theme", "ndt-theme"] as const;

export interface ThemeStorage {
  getItem(key: string): string | null;
}

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(storage: ThemeStorage | null): Theme | null {
  if (!storage) return null;
  for (const key of THEME_STORAGE_KEYS) {
    const value = storage.getItem(key);
    if (isTheme(value)) return value;
  }
  return null;
}

export function resolveTheme(options: {
  storage?: ThemeStorage | null;
  matchesDarkScheme?: () => boolean;
  fallback?: Theme;
}): Theme {
  const stored = readStoredTheme(options.storage ?? null);
  if (stored) return stored;
  if (options.matchesDarkScheme?.()) return "dark";
  return options.fallback ?? "light";
}

/**
 * Resolve the current theme from the browser. Falls back to light when the
 * DOM is unavailable (e.g. server rendering).
 */
export function resolveDomTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return resolveTheme({
    storage: window.localStorage,
    matchesDarkScheme: () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  });
}
