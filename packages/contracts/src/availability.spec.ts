import { describe, expect, it } from "vitest";
import { AVAILABILITY_VALUES, isAvailability } from "./availability";

describe("availability", () => {
	it("lists all availability values", () => {
		expect(AVAILABILITY_VALUES).toHaveLength(5);
	});

	it("accepts valid availability", () => {
		for (const v of AVAILABILITY_VALUES) expect(isAvailability(v)).toBe(true);
	});

	it("rejects invalid availability", () => {
		expect(isAvailability("nope")).toBe(false);
		expect(isAvailability(42)).toBe(false);
		expect(isAvailability(null)).toBe(false);
		expect(isAvailability(undefined)).toBe(false);
	});
});
