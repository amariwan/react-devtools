/**
 * Pure shell interaction rules, kept out of React so keyboard routing and panel
 * selection are testable without a DOM.
 */

export type ShellKeyAction =
  | "open-devtools"
  | "toggle-palette"
  | "close-overlays"
  | "close-devtools"
  | null;

export interface ShellShortcutInput {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  /** Whether the DevTools dock is currently open. */
  open: boolean;
  /** Whether the command palette or settings view is on top of the dock. */
  overlayOpen: boolean;
}

/**
 * Maps a keydown event to a shell action.
 *
 * - Ctrl/Cmd+K opens the DevTools when closed, otherwise toggles the palette.
 * - Escape closes an overlay first, and only closes the dock when nothing is
 *   layered on top, so one press never tears down more than the user sees.
 */
export function resolveShellShortcut(
  input: ShellShortcutInput,
): ShellKeyAction {
  const mod = input.metaKey === true || input.ctrlKey === true;
  if (mod && input.key.toLowerCase() === "k") {
    return input.open ? "toggle-palette" : "open-devtools";
  }
  if (input.key === "Escape") {
    if (input.overlayOpen) return "close-overlays";
    return input.open ? "close-devtools" : null;
  }
  return null;
}

/**
 * Keeps the active panel valid as the visible set changes (for example when the
 * user hides the active panel in settings). Falls back to the first visible
 * panel, or null when every panel is hidden.
 */
export function pickActivePanelId<T extends { id: string }>(
  visiblePanels: readonly T[],
  activePanelId: string | null,
): string | null {
  if (
    activePanelId !== null &&
    visiblePanels.some((panel) => panel.id === activePanelId)
  ) {
    return activePanelId;
  }
  return visiblePanels[0]?.id ?? null;
}
