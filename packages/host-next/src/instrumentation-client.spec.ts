import { describe, expect, it } from "vitest";
import {
	createNavigationTracker,
	reportWebVitals,
} from "./instrumentation-client";

describe("instrumentation client", () => {
	it("tracks navigation", () => {
		const events: unknown[] = [];
		const t = createNavigationTracker((e) => events.push(e));
		t.onRouterTransitionStart("/a");
		t.onRouteChangeComplete("/a");
		expect(events).toHaveLength(2);
		expect(t.currentUrl()).toBe("/a");
	});

	it("reports web vitals", () => {
		expect(reportWebVitals({ name: "LCP", value: 100 })).toEqual({
			name: "LCP",
			value: 100,
			rating: "unknown",
		});
	});

	it("reports web vitals with rating", () => {
		expect(
			reportWebVitals({ name: "LCP", value: 100, rating: "good" }),
		).toEqual({
			name: "LCP",
			value: 100,
			rating: "good",
		});
	});
});
