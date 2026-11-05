import { describe, expect, it } from "vitest";
import { buildTimelineData } from "./timeline-data";

describe("timeline data", () => {
	it("handles null", () => {
		const d = buildTimelineData(null);
		expect(d.status).toBe("unavailable");
		expect(d.count).toBe(0);
	});

	it("builds from snapshot", () => {
		const snap = {
			status: "available",
			data: { recording: true, events: [{ id: "1" }], dropped: 2 },
		} as never;
		const d = buildTimelineData(snap);
		expect(d.recording).toBe(true);
		expect(d.count).toBe(1);
		expect(d.dropped).toBe(2);
	});
});
