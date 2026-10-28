import { describe, expect, it } from "vitest";
import type { ComponentNode } from "@next-devtools/runtime-react";
import {
  filterComponentRows,
  flattenComponentTree,
  formatInspectorValue,
  formatSourceLocation,
} from "../../plugins/components/src/component-tree-data";

function node(
  id: string,
  parentId: string | null,
  childIds: string[] = [],
  overrides: Partial<ComponentNode> = {},
): ComponentNode {
  return {
    id,
    displayName: id,
    kind: "function",
    parentId,
    childIds,
    hasState: false,
    ...overrides,
  };
}

describe("component tree data", () => {
  it("flattens the tree depth-first with indentation depth", () => {
    const nodes = [
      node("root", null, ["app", "aside"]),
      node("app", "root", ["layout", "page"]),
      node("layout", "app", ["nav"]),
      node("nav", "layout"),
      node("page", "app"),
      node("aside", "root"),
    ];

    expect(
      flattenComponentTree(nodes).map((row) => [row.node.id, row.depth]),
    ).toEqual([
      ["root", 0],
      ["app", 1],
      ["layout", 2],
      ["nav", 3],
      ["page", 2],
      ["aside", 1],
    ]);
  });

  it("promotes orphans, ignores unknown child ids, and survives cycles", () => {
    const nodes = [
      node("a", null, ["b", "missing"]),
      node("b", "a", ["a", "c"]),
      node("c", "b"),
      node("orphan", "not-in-snapshot"),
    ];

    const rows = flattenComponentTree(nodes);
    expect(rows.map((row) => row.node.id)).toEqual(["a", "b", "c", "orphan"]);
    expect(rows.map((row) => row.depth)).toEqual([0, 1, 2, 0]);
  });

  it("filters rows with fuzzy matching but keeps tree order and depth", () => {
    const rows = flattenComponentTree([
      node("page", null, ["layout"]),
      node("layout", "page", ["userSearch"]),
      node("userSearch", "layout"),
      node("footer", "page"),
    ]);

    const filtered = filterComponentRows(rows, "usearch");
    expect(filtered.map((row) => row.node.id)).toEqual(["userSearch"]);
    expect(filtered[0]?.depth).toBe(2);

    expect(filterComponentRows(rows, "")).toEqual(rows);
    expect(filterComponentRows(rows, "   ")).toEqual(rows);
    expect(filterComponentRows(rows, "zzz")).toEqual([]);
  });

  it("formats source locations and inspector values safely", () => {
    expect(formatSourceLocation(null)).toBeNull();
    expect(formatSourceLocation({ file: "/a.tsx" })).toBe("/a.tsx");
    expect(formatSourceLocation({ file: "/a.tsx", line: 4 })).toBe("/a.tsx:4");
    expect(formatSourceLocation({ file: "/a.tsx", line: 4, column: 7 })).toBe(
      "/a.tsx:4:7",
    );

    expect(formatInspectorValue(undefined)).toBe("undefined");
    expect(formatInspectorValue("plain")).toBe("plain");
    expect(formatInspectorValue({ open: true })).toBe('{\n  "open": true\n}');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => formatInspectorValue(circular)).not.toThrow();
  });
});
