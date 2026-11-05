import { describe, expect, it } from "vitest";
import { createPermissionClient } from "./permission-client";

describe("permission client", () => {
	it("checks granted", () => {
		const c = createPermissionClient(["read-state"]);
		expect(c.check("read-state")).toBe(true);
		expect(c.check("write")).toBe(false);
	});

	it("requests granted returns true", async () => {
		const c = createPermissionClient(["read-state"]);
		expect(await c.request("read-state")).toBe(true);
		expect(await c.request("write")).toBe(false);
	});
});
