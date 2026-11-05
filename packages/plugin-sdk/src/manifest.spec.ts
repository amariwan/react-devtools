import { describe, expect, it } from "vitest";
import type { PluginManifest } from "./manifest";

describe("plugin manifest type", () => {
	it("compiles", () => {
		const m = {} as PluginManifest;
		expect(m).toBeTruthy();
	});
});
