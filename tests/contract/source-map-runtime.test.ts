import { describe, expect, it } from "vitest";
import { resolveSourceMapPosition } from "../../packages/core/src/source-map-runtime";

describe("runtime source maps", () => {
  it("maps a generated position to an original source position", () => {
    const map = {
      version: 3,
      sources: ["../src/Button.tsx"],
      mappings: "AAAA,CAAC",
    };

    expect(
      resolveSourceMapPosition(map, 1, 1, "https://app.test/_next/app.js.map"),
    ).toEqual({
      source: "https://app.test/src/Button.tsx",
      line: 1,
      column: 2,
    });
  });

  it("rejects malformed maps and unmapped positions", () => {
    expect(resolveSourceMapPosition({ version: 2 }, 1, 1)).toBeUndefined();
    expect(
      resolveSourceMapPosition(
        { version: 3, sources: ["a.ts"], mappings: "" },
        1,
        1,
      ),
    ).toBeUndefined();
  });

  it("carries VLQ source deltas across generated lines", () => {
    const map = {
      version: 3,
      sources: ["src/App.tsx"],
      // line 1 -> original line 1/column 1; line 2 advances the original
      // line and column via deltas.
      mappings: "AAAA;AACA",
    };

    expect(resolveSourceMapPosition(map, 2, 0)).toEqual({
      source: "src/App.tsx",
      line: 2,
      column: 1,
    });
  });
});
