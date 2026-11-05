import { describe, expect, it } from "vitest";
import { buildNetworkData } from "./network-data";

describe("network data", () => {
	it("handles null snapshot", () => {
		const d = buildNetworkData(null);
		expect(d.status).toBe("unavailable");
		expect(d.entries).toHaveLength(0);
	});

	it("builds from snapshot", () => {
		const snap = {
			status: "available",
			data: { recording: true, dropped: 1, entries: [{ id: "1" }] },
		} as never;
		const d = buildNetworkData(snap);
		expect(d.recording).toBe(true);
		expect(d.count).toBe(1);
	});
});
