import { describe, expect, it } from "vitest";
import { buildUniversalSearchEntries } from "../../packages/ui/src/universal-search";

describe("universal search", () => {
  it("indexes bounded runtime evidence with panel destinations", () => {
    const entries = buildUniversalSearchEntries({
      react: {
        tree: [{ id: "c1", displayName: "Dashboard", kind: "function" }],
      },
      routes: {
        tree: {
          nodes: [
            {
              id: "r1",
              name: "dashboard",
              relativePath: "app/dashboard/page.tsx",
            },
          ],
        },
      },
      timeline: {
        events: [
          {
            id: "e1",
            layer: "navigation",
            type: "navigation",
            timestampUnixMs: 1,
          },
        ],
      },
      network: {
        entries: [
          { id: "n1", url: "http://localhost/api", initiatorType: "fetch" },
        ],
      },
      diagnostics: {
        events: [{ id: "d1", message: "Failed to load", kind: "error" }],
      },
    });

    expect(entries).toEqual([
      expect.objectContaining({
        kind: "component",
        title: "Dashboard",
        panelId: "components",
      }),
      expect.objectContaining({
        kind: "route",
        title: "dashboard",
        panelId: "pages",
      }),
      expect.objectContaining({
        kind: "timeline",
        title: "navigation · navigation",
        panelId: "timeline",
      }),
      expect.objectContaining({
        kind: "network",
        title: "http://localhost/api",
        panelId: "network",
      }),
      expect.objectContaining({
        kind: "error",
        title: "Failed to load",
        panelId: "agent-mcp",
      }),
    ]);
  });

  it("bounds indexed results", () => {
    const entries = buildUniversalSearchEntries(
      {
        react: {
          tree: Array.from({ length: 10 }, (_, i) => ({
            id: String(i),
            displayName: `C${i}`,
          })),
        },
      },
      3,
    );
    expect(entries).toHaveLength(3);
  });
});
