import { describe, expect, it } from "vitest";
import {
  filterTree,
  flattenTree,
  toggleExpanded,
  type TreeNode,
} from "@next-devtools/ui";

interface Node extends TreeNode {
  label: string;
}

const tree: Node[] = [
  {
    id: "app",
    label: "App",
    children: [
      {
        id: "layout",
        label: "Layout",
        children: [{ id: "page", label: "Page" }],
      },
      { id: "nav", label: "Nav" },
    ],
  },
  { id: "sibling", label: "Sibling" },
];

describe("flattenTree", () => {
  it("emits only root nodes when nothing is expanded", () => {
    const rows = flattenTree(tree, new Set());
    expect(rows.map((r) => r.node.id)).toEqual(["app", "sibling"]);
    expect(rows[0]).toMatchObject({
      depth: 0,
      hasChildren: true,
      expanded: false,
    });
  });

  it("expands children when their id is present", () => {
    const rows = flattenTree(tree, new Set(["app"]));
    expect(rows.map((r) => r.node.id)).toEqual([
      "app",
      "layout",
      "nav",
      "sibling",
    ]);
    expect(rows[1]).toMatchObject({ depth: 1, hasChildren: true });
    expect(rows[2]).toMatchObject({ depth: 1, hasChildren: false });
  });

  it("recurses through nested expansion", () => {
    const rows = flattenTree(tree, new Set(["app", "layout"]));
    expect(rows.map((r) => r.node.id)).toEqual([
      "app",
      "layout",
      "page",
      "nav",
      "sibling",
    ]);
    expect(rows[2]).toMatchObject({ depth: 2 });
  });

  it("assigns stable sequential row indices", () => {
    const rows = flattenTree(tree, new Set(["app", "layout"]));
    expect(rows.map((r) => r.index)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("toggleExpanded", () => {
  it("adds and removes ids immutably", () => {
    const base = new Set(["app"]);
    const added = toggleExpanded(base, "layout");
    expect([...added].sort()).toEqual(["app", "layout"]);
    expect(base.has("layout")).toBe(false); // original untouched

    const removed = toggleExpanded(added, "app");
    expect([...removed]).toEqual(["layout"]);
  });
});

describe("filterTree", () => {
  it("keeps matching leaves and prunes non-matching branches", () => {
    const result = filterTree(tree, (n) => n.label === "Page");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("app");
    expect(result[0]?.children).toHaveLength(1);
    expect(result[0]?.children?.[0]?.id).toBe("layout");
    expect(result[0]?.children?.[0]?.children?.[0]?.id).toBe("page");
  });

  it("drops branches with no matches", () => {
    const result = filterTree(tree, (n) => n.label === "Page");
    expect(result[0]?.children?.[0]?.children).toHaveLength(1);
    // the "nav" sibling (no match) is pruned
    expect(result[0]?.children?.[0]?.id).toBe("layout");
  });

  it("keeps a node when it matches even if children do not", () => {
    const result = filterTree(tree, (n) => n.id === "sibling");
    expect(result.map((n) => n.id)).toEqual(["sibling"]);
  });
});
