import { describe, expect, it } from "vitest";
import { createCapabilityRegistry } from "./capability-registry";

describe("capability registry", () => {
	it("provides and requires", () => {
		const r = createCapabilityRegistry();
		r.provide({ id: "x", availability: "available" } as never);
		expect(r.has("x")).toBe(true);
		expect(r.require("x")?.id).toBe("x");
	});

	it("notifies on change", () => {
		const r = createCapabilityRegistry();
		let called = 0;
		r.onChange(() => {
			called += 1;
		});
		r.provide({ id: "x", availability: "available" } as never);
		r.provide({ id: "x", availability: "available" } as never); // same, no notify
		expect(called).toBe(1);
	});

	it("lists capabilities", () => {
		const r = createCapabilityRegistry();
		r.provide({ id: "a", availability: "available" } as never);
		r.provide({ id: "b", availability: "partial" } as never);
		expect(r.list()).toHaveLength(2);
	});
});
