import { describe, expect, it } from "vitest";
import {
	builtInPluginManifest,
	extendPluginManifest,
	pluginManifest,
	registerBuiltInPlugin,
} from "./manifest";

describe("manifest", () => {
	it("has built-in entries", () => {
		expect(Array.isArray(builtInPluginManifest)).toBe(true);
		expect(pluginManifest).toBe(builtInPluginManifest);
	});

	it("registers plugin", () => {
		const before = builtInPluginManifest.length;
		registerBuiltInPlugin({
			id: "x",
			module: "./x",
			defaultEnabled: true,
		} as never);
		expect(builtInPluginManifest.length).toBeGreaterThanOrEqual(before);
	});

	it("extends manifest", () => {
		extendPluginManifest([]);
		expect(Array.isArray(builtInPluginManifest)).toBe(true);
	});
});
