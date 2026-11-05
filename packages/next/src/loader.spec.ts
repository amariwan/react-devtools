import { definePlugin } from "@next-devtools/plugin-sdk";
import { describe, expect, it } from "vitest";
import { loadBuiltInPlugins, loadPlugin } from "./loader";

describe("loader", () => {
	it("exports loadBuiltInPlugins", () => {
		expect(typeof loadBuiltInPlugins).toBe("function");
	});

	it("exports loadPlugin", () => {
		expect(typeof loadPlugin).toBe("function");
	});
});
