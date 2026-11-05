import { describe, expect, it } from "vitest";
import { buildAgentMcpHealthData } from "./agent-mcp-data";

describe("agent mcp data", () => {
	it("builds from empty registry", () => {
		const registry = {
			list: () => [],
			services: { get: () => undefined },
			capabilities: { list: () => [] },
			panels: { list: () => [] },
			commands: { list: () => [] },
		} as never;
		const d = buildAgentMcpHealthData(registry);
		expect(d).toBeTruthy();
		expect(Array.isArray(d.services)).toBe(true);
	});
});
