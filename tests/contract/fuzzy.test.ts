import { describe, expect, it } from "vitest";
import { fuzzyFilter, fuzzyScore } from "@next-devtools/ui";

describe("fuzzyScore", () => {
  it("returns null when the query is not a subsequence", () => {
    expect(fuzzyScore("zzz", "hello")).toBeNull();
    expect(fuzzyScore("abc", "xyz")).toBeNull();
  });

  it("returns 0 for an empty query", () => {
    expect(fuzzyScore("", "anything")).toBe(0);
  });

  it("matches case-insensitively", () => {
    expect(fuzzyScore("cmp", "Components")).not.toBeNull();
    expect(fuzzyScore("COMP", "components")).not.toBeNull();
  });

  it("scores an exact-prefix match higher than a scattered match", () => {
    const prefix = fuzzyScore("com", "components")!;
    const scattered = fuzzyScore("com", "c-o-mponent")!;
    expect(prefix).toBeGreaterThan(scattered);
  });
});

describe("fuzzyFilter", () => {
  const items = [
    { id: "overview", title: "Overview" },
    { id: "components", title: "Components" },
    { id: "pages", title: "Pages" },
    { id: "graph", title: "Graph" },
  ];

  it("returns all items in order for an empty query", () => {
    expect(
      fuzzyFilter("", items, (i) => i.title).map((s) => s.item.id),
    ).toEqual(["overview", "components", "pages", "graph"]);
  });

  it("ranks better matches first", () => {
    const result = fuzzyFilter("comp", items, (i) => i.title);
    expect(result[0]?.item.id).toBe("components");
  });

  it("drops non-matching items", () => {
    const result = fuzzyFilter("graph", items, (i) => i.title);
    expect(result.map((s) => s.item.id)).toEqual(["graph"]);
  });
});
