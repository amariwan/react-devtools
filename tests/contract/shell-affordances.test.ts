import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { pickActivePanelId, resolveShellShortcut } from "@next-devtools/ui";

describe("shell keyboard affordances", () => {
  it("opens the dock from a closed state with Ctrl/Cmd+K", () => {
    expect(
      resolveShellShortcut({
        key: "k",
        metaKey: true,
        open: false,
        overlayOpen: false,
      }),
    ).toBe("open-devtools");
    expect(
      resolveShellShortcut({
        key: "K",
        ctrlKey: true,
        open: false,
        overlayOpen: false,
      }),
    ).toBe("open-devtools");
  });

  it("toggles the palette with Ctrl/Cmd+K while the dock is open", () => {
    expect(
      resolveShellShortcut({
        key: "k",
        ctrlKey: true,
        open: true,
        overlayOpen: false,
      }),
    ).toBe("toggle-palette");
    expect(
      resolveShellShortcut({
        key: "k",
        metaKey: true,
        open: true,
        overlayOpen: true,
      }),
    ).toBe("toggle-palette");
  });

  it("closes overlays before the dock on Escape", () => {
    expect(
      resolveShellShortcut({ key: "Escape", open: true, overlayOpen: true }),
    ).toBe("close-overlays");
    expect(
      resolveShellShortcut({ key: "Escape", open: true, overlayOpen: false }),
    ).toBe("close-devtools");
    expect(
      resolveShellShortcut({ key: "Escape", open: false, overlayOpen: false }),
    ).toBeNull();
  });

  it("ignores unrelated keys and modifier-less K", () => {
    expect(
      resolveShellShortcut({ key: "k", open: true, overlayOpen: false }),
    ).toBeNull();
    expect(
      resolveShellShortcut({
        key: "j",
        metaKey: true,
        open: true,
        overlayOpen: false,
      }),
    ).toBeNull();
  });
});

describe("active panel selection", () => {
  const panels = [{ id: "components" }, { id: "pages" }, { id: "network" }];

  it("keeps a visible active panel", () => {
    expect(pickActivePanelId(panels, "pages")).toBe("pages");
  });

  it("falls back to the first visible panel when the active one is hidden", () => {
    expect(pickActivePanelId([panels[1]!, panels[2]!], "components")).toBe(
      "pages",
    );
    expect(pickActivePanelId(panels, null)).toBe("components");
  });

  it("returns null when every panel is hidden", () => {
    expect(pickActivePanelId([], "pages")).toBeNull();
  });
});

describe("shell source hygiene", () => {
  const files = ["packages/ui/src/shell/shell.tsx", "packages/next/src/client.tsx"];
  const debugMarkers = [
    "DEVTOOLS_SHELL_RENDER",
    "OPEN_STATE",
    "LAUNCHER_CLICK",
    "NEXT_DEVTOOLS_EFFECT",
    "NEXT_DEVTOOLS_LOADED",
  ];

  it("ships no temporary debug logging", () => {
    for (const file of files) {
      const source = readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/console\.log\(/);
      for (const marker of debugMarkers) {
        expect(source).not.toContain(marker);
      }
    }
  });
});
