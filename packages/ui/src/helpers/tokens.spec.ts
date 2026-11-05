import { describe, expect, it } from "vitest";
import { SPACE_UNIT, getColorTokens, getStatusColors } from "./tokens";

describe("tokens", () => {
	it("returns color tokens for themes", () => {
		const light = getColorTokens("light");
		const dark = getColorTokens("dark");
		expect(light).toBeTruthy();
		expect(dark).toBeTruthy();
	});

	it("returns status colors", () => {
		expect(getStatusColors("light")).toBeTruthy();
	});

	it("space unit is 4", () => {
		expect(SPACE_UNIT).toBe(4);
	});
});
