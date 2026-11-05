import { describe, expect, it } from "vitest";
import type { PluginContext } from "./context";

describe("plugin context type", () => {
	it("compiles", () => {
		const c = {} as PluginContext;
		expect(c).toBeTruthy();
	});
});
