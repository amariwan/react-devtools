import { describe, expect, it } from "vitest";
import { encodeValue } from "@next-devtools/contracts";
import { childrenOf, summarizeValue } from "@next-devtools/ui";

describe("summarizeValue", () => {
  it("labels primitives", () => {
    expect(summarizeValue(encodeValue(null))).toEqual({
      kind: "null",
      label: "null",
      expandable: false,
    });
    expect(summarizeValue(encodeValue(true))).toMatchObject({
      kind: "boolean",
      label: "true",
    });
    expect(summarizeValue(encodeValue(42))).toMatchObject({
      kind: "number",
      label: "42",
    });
    expect(summarizeValue(encodeValue("hi"))).toMatchObject({
      kind: "string",
      label: '"hi"',
    });
    expect(summarizeValue(encodeValue(undefined))).toMatchObject({
      kind: "undefined",
      label: "undefined",
    });
  });

  it("labels special values", () => {
    expect(summarizeValue(encodeValue(9007199254740993n))).toMatchObject({
      kind: "bigint",
      label: "9007199254740993n",
    });
    expect(
      summarizeValue(encodeValue(new Date("2026-01-02T03:04:05.000Z"))),
    ).toMatchObject({ kind: "date", label: "2026-01-02T03:04:05.000Z" });
    expect(summarizeValue(encodeValue(/ab+c/gi))).toMatchObject({
      kind: "regexp",
      label: "/ab+c/gi",
    });
  });

  it("labels collections and marks them expandable only when non-empty", () => {
    expect(summarizeValue(encodeValue([1, 2, 3]))).toMatchObject({
      kind: "array",
      label: "Array(3)",
      expandable: true,
    });
    expect(summarizeValue(encodeValue([]))).toMatchObject({
      kind: "array",
      expandable: false,
    });
    expect(summarizeValue(encodeValue(new Map([["a", 1]])))).toMatchObject({
      kind: "map",
      label: "Map(1)",
      expandable: true,
    });
    expect(summarizeValue(encodeValue(new Set([1])))).toMatchObject({
      kind: "set",
      label: "Set(1)",
      expandable: true,
    });
    expect(summarizeValue(encodeValue({ a: 1, b: 2 }))).toMatchObject({
      kind: "object",
      label: "{2}",
      expandable: true,
    });
  });

  it("survives a cyclic structure via the codec ref marker", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    const encoded = encodeValue(cyclic);
    // The top-level object contains a self reference.
    expect(encoded).toMatchObject({ __ndt_type: "object" });
  });
});

describe("childrenOf", () => {
  it("returns empty for primitives", () => {
    expect(childrenOf(encodeValue(1))).toEqual([]);
    expect(childrenOf(encodeValue("x"))).toEqual([]);
    expect(childrenOf(encodeValue(null))).toEqual([]);
  });

  it("exposes array items by index", () => {
    const kids = childrenOf(encodeValue(["a", "b"]));
    expect(kids.map((k) => k.key)).toEqual(["0", "1"]);
    expect(kids[0]?.value).toBe("a");
  });

  it("exposes object entries by key", () => {
    const kids = childrenOf(encodeValue({ x: 1 }));
    expect(kids).toHaveLength(1);
    expect(kids[0]?.key).toBe("x");
  });

  it("exposes set values by index", () => {
    const kids = childrenOf(encodeValue(new Set([10, 20])));
    expect(kids.map((k) => k.key)).toEqual(["0", "1"]);
  });
});
