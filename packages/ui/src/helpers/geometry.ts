/**
 * Geometry helpers for the SplitView resize handle, popover positioning, and
 * keyboard-driven resizing.
 */

export interface Anchor {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Resize a primary dimension by a pointer delta, clamped to [min, max]. */
export function resizePrimary(
  primary: number,
  delta: number,
  options: { min: number; max: number },
): number {
  return clamp(primary + delta, options.min, options.max);
}

/** Resize a primary dimension by a keyboard step, clamped to [min, max]. */
export function keyboardResize(
  primary: number,
  direction: -1 | 1,
  step: number,
  options: { min: number; max: number },
): number {
  return clamp(primary + direction * step, options.min, options.max);
}

/** Clamp a popover/tooltip anchor so it stays inside the viewport. */
export function clampAnchor(
  anchor: Anchor,
  size: Size,
  viewport: Size,
  margin = 8,
): Anchor {
  const maxX = Math.max(margin, viewport.width - size.width - margin);
  const maxY = Math.max(margin, viewport.height - size.height - margin);
  return {
    x: clamp(anchor.x, margin, maxX),
    y: clamp(anchor.y, margin, maxY),
  };
}
