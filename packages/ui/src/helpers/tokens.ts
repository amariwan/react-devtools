/**
 * Design tokens for the DevTools shell and plugins.
 *
 * Single source of truth for color, geometry, typography, and status values.
 * Values are derived from `docs/superpowers/specs/2026-10-26-vue-devtools-parity-design.md`
 * (token table) and `docs/DESIGN.md` (status colors). Keep both documents in sync
 * when these values change.
 */

export type Theme = "light" | "dark";

/** Surface/text roles used across the shell and every plugin. */
export interface ColorTokens {
  /** Primary background surface. */
  base: string;
  /** Secondary background surface (rails, wells). */
  subtle: string;
  /** Raised surface (cards, dialogs, menus). */
  elevated: string;
  /** Primary foreground text. */
  text: string;
  /** Secondary foreground text. */
  muted: string;
  /** Hairline borders. */
  border: string;
  /** Hover / pressed fill. */
  hover: string;
  /** Readable accent for text, icons, and links. */
  accent: string;
  /** Accent fill used for active selection backgrounds. */
  accentSelected: string;
  /** Foreground placed on top of `accentSelected`. */
  onAccent: string;
  /** Positive / healthy status. */
  success: string;
  /** Cautionary status. */
  warning: string;
  /** Destructive / unhealthy status. */
  error: string;
}

export const LIGHT_COLORS: Readonly<ColorTokens> = {
  base: "#fafafa",
  subtle: "#f4f4f5",
  elevated: "#ffffff",
  text: "#18181b",
  muted: "#52525b",
  border: "rgba(82,82,91,0.18)",
  hover: "rgba(82,82,91,0.08)",
  accent: "#2563eb",
  accentSelected: "#2563eb",
  onAccent: "#ffffff",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
};

export const DARK_COLORS: Readonly<ColorTokens> = {
  base: "#0e0e10",
  subtle: "#151518",
  elevated: "#18181b",
  text: "#e4e4e7",
  muted: "#a1a1aa",
  border: "rgba(161,161,170,0.18)",
  hover: "rgba(161,161,170,0.10)",
  accent: "#60a5fa",
  accentSelected: "#2563eb",
  onAccent: "#ffffff",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
};

/** Semantic status tones shown by capability badges and status dots. */
export type StatusTone =
  | "available"
  | "partial"
  | "requires-instrumentation"
  | "experimental"
  | "unavailable"
  | "error"
  | "diagnostic";

export type StatusColorTokens = Record<StatusTone, string>;

export const LIGHT_STATUS_COLORS: Readonly<StatusColorTokens> = {
  available: "#16a34a",
  partial: "#d97706",
  "requires-instrumentation": "#2563eb",
  experimental: "#7c3aed",
  unavailable: "#dc2626",
  error: "#dc2626",
  diagnostic: "#ff4757",
};

export const DARK_STATUS_COLORS: Readonly<StatusColorTokens> = {
  available: "#22c55e",
  partial: "#f59e0b",
  "requires-instrumentation": "#3b82f6",
  experimental: "#8b5cf6",
  unavailable: "#ef4444",
  error: "#ef4444",
  diagnostic: "#ff4757",
};

/** Base spacing unit in pixels. All paddings/margins are multiples of this. */
export const SPACE_UNIT = 4;

/** Geometry values shared by the shell and primitives. */
export const GEOMETRY = {
  controlHeight: 28,
  treeRowHeight: 24,
  navItemHeight: 40,
  railWidth: 52,
  borderWidth: 1,
  radiusControl: 4,
  radiusCard: 8,
} as const;

/** Typography values. Font sizes are in pixels. */
export const TYPOGRAPHY = {
  fontSizeDefault: 14,
  fontSizeMono: 12,
} as const;

/** Isolated UI font stacks; never inherited from the inspected application. */
export const FONT_FAMILY = {
  sans: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  mono: `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace`,
} as const;

export function getColorTokens(theme: Theme): Readonly<ColorTokens> {
  return theme === "dark" ? DARK_COLORS : LIGHT_COLORS;
}

export function getStatusColors(theme: Theme): Readonly<StatusColorTokens> {
  return theme === "dark" ? DARK_STATUS_COLORS : LIGHT_STATUS_COLORS;
}
