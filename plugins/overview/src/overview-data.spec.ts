import { describe, expect, it } from "vitest";
import { buildOverviewData } from "./overview-data";

describe("overview data", () => {
	it("builds from empty registry", () => {
		const registry = {
			list: () => [],
			panels: { list: () => [] },
			commands: { list: () => [] },
			capabilities: { list: () => [] },
			services: { get: () => undefined },
		} as never;
		const d = buildOverviewData(registry);
		expect(d.connectionStatus).toBe("disconnected");
		expect(d.services.length).toBeGreaterThan(0);
	});
});
