import { describe, expect, it } from "vitest";
import { buildReduxData } from "./redux-data";

describe("redux data", () => {
	it("handles null", () => {
		const d = buildReduxData(null, false);
		expect(d.adapters).toHaveLength(0);
		expect(d.hasStores).toBe(false);
	});

	it("filters adapters", () => {
		const snap = {
			status: "available",
			data: {
				adapters: [
					{ id: "redux-1", label: "r", canMutate: true },
					{ id: "zustand", label: "z", canMutate: false },
				],
			},
		} as never;
		const d = buildReduxData(snap, true);
		expect(d.adapters).toHaveLength(1);
		expect(d.hasStores).toBe(true);
	});
});
