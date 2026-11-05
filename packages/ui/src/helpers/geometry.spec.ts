import { describe, expect, it } from "vitest";
import { clamp, keyboardResize, resizePrimary } from "./geometry";

describe("geometry", () => {
	it("clamps values", () => {
		expect(clamp(5, 0, 10)).toBe(5);
		expect(clamp(-1, 0, 10)).toBe(0);
		expect(clamp(11, 0, 10)).toBe(10);
	});

	it("resizes primary by delta", () => {
		expect(resizePrimary(5, 2, { min: 0, max: 10 })).toBe(7);
		expect(resizePrimary(9, 5, { min: 0, max: 10 })).toBe(10);
	});

	it("keyboard resizes", () => {
		expect(keyboardResize(5, 1, 2, { min: 0, max: 10 })).toBe(7);
		expect(keyboardResize(5, -1, 2, { min: 0, max: 10 })).toBe(3);
	});
});
