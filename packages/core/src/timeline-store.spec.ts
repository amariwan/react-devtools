import { describe, expect, it } from "vitest";
import { createTimelineStore } from "./timeline-store";

describe("timeline store", () => {
	it("emits and lists", () => {
		const s = createTimelineStore(10);
		const ev = s.emit({
			layer: "l",
			type: "t",
			timestampUnixMs: 1,
			payload: {},
		});
		expect(ev.id).toBe("ev_1");
		const { items } = s.list();
		expect(items).toHaveLength(1);
	});

	it("drops when over capacity", () => {
		const s = createTimelineStore(2);
		s.emit({ layer: "l", type: "t", timestampUnixMs: 1, payload: {} });
		s.emit({ layer: "l", type: "t", timestampUnixMs: 2, payload: {} });
		s.emit({ layer: "l", type: "t", timestampUnixMs: 3, payload: {} });
		expect(s.size()).toBe(2);
		expect(s.droppedCount()).toBe(1);
	});

	it("filters by layer", () => {
		const s = createTimelineStore(10);
		s.emit({ layer: "a", type: "t", timestampUnixMs: 1, payload: {} });
		s.emit({ layer: "b", type: "t", timestampUnixMs: 2, payload: {} });
		const { items } = s.list({ layers: ["a"] });
		expect(items).toHaveLength(1);
	});
});
