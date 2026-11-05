import { describe, expect, it } from "vitest";
import { buildZustandData } from "./zustand-data";

describe("zustand data", () => {
	it("handles null", () => {
		const d = buildZustandData(null);
		expect(d.adapters).toHaveLength(0);
		expect(d.hasStores).toBe(false);
	});

	it("filters adapters", () => {
		const snap = {
			status: "available",
			data: {
				adapters: [
					{ id: "zustand-1", label: "z", canMutate: true },
					{ id: "redux", label: "r", canMutate: false },
				],
			},
		} as never;
		const d = buildZustandData(snap);
		expect(d.adapters).toHaveLength(1);
		expect(d.hasStores).toBe(true);
	});
});
