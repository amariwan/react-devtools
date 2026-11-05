import { describe, expect, it } from "vitest";
import { createPluginRegistry } from "./plugin-registry";

describe("plugin registry", () => {
	it("creates registry", () => {
		const r = createPluginRegistry();
		expect(r).toBeTruthy();
		expect(r.list()).toEqual([]);
	});

	it("exposes services", () => {
		const r = createPluginRegistry();
		expect(r.services).toBeTruthy();
	});
});
