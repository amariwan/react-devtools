import { describe, expect, it } from "vitest";
import {
  clamp,
  clampAnchor,
  keyboardResize,
  resizePrimary,
} from "@next-devtools/ui";

describe("clamp", () => {
  it("clamps into the inclusive range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
  });
});

describe("resizePrimary", () => {
  const opts = { min: 200, max: 800 };

  it("applies the delta within bounds", () => {
    expect(resizePrimary(420, 50, opts)).toBe(470);
  });

  it("clamps at both ends", () => {
    expect(resizePrimary(210, -100, opts)).toBe(200);
    expect(resizePrimary(790, 100, opts)).toBe(800);
  });
});

describe("keyboardResize", () => {
  const opts = { min: 200, max: 800 };

  it("steps in the requested direction", () => {
    expect(keyboardResize(420, 1, 40, opts)).toBe(460);
    expect(keyboardResize(420, -1, 40, opts)).toBe(380);
  });

  it("clamps stepped values", () => {
    expect(keyboardResize(210, -1, 40, opts)).toBe(200);
    expect(keyboardResize(790, 1, 40, opts)).toBe(800);
  });
});

describe("clampAnchor", () => {
  it("keeps an anchor inside the viewport", () => {
    const viewport = { width: 1000, height: 800 };
    const size = { width: 200, height: 100 };
    expect(clampAnchor({ x: 950, y: 750 }, size, viewport)).toEqual({
      x: 792,
      y: 692,
    });
    expect(clampAnchor({ x: -50, y: -50 }, size, viewport)).toEqual({
      x: 8,
      y: 8,
    });
  });

  it("leaves a comfortably-placed anchor unchanged", () => {
    const viewport = { width: 1000, height: 800 };
    const size = { width: 200, height: 100 };
    expect(clampAnchor({ x: 100, y: 100 }, size, viewport)).toEqual({
      x: 100,
      y: 100,
    });
  });
});
