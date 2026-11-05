import { describe, expect, it } from "vitest";
import { buildTanStackQueryData } from "./tanstack-query-data";

describe("tanstack query data", () => {
	it("handles null", () => {
		const d = buildTanStackQueryData(null, false);
		expect(d.adapters).toHaveLength(0);
		expect(d.hasData).toBe(false);
	});

	it("filters adapters", () => {
		const snap = {
			status: "available",
			data: {
				adapters: [
					{ id: "tanstack-query", label: "q", canMutate: true },
					{ id: "zustand", label: "z", canMutate: false },
				],
			},
		} as never;
		const d = buildTanStackQueryData(snap, false);
		expect(d.adapters).toHaveLength(1);
		expect(d.hasData).toBe(true);
	});
});
