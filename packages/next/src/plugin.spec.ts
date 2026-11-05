import { describe, expect, it } from "vitest";
import { createPlugin, definePlugin } from "./plugin";

describe("plugin", () => {
	it("defines plugin", () => {
		const p = definePlugin({ id: "x" } as never);
		expect(p.id).toBe("x");
	});

	it("createPlugin alias", () => {
		const p = createPlugin({ id: "y" } as never);
		expect(p.id).toBe("y");
	});
});
