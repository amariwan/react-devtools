import { describe, expect, it } from "vitest";
import type { DevtoolsPlugin } from "./plugin";

describe("plugin type", () => {
	it("compiles", () => {
		const p = {} as DevtoolsPlugin;
		expect(p).toBeTruthy();
	});
});
