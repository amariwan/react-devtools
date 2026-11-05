import { describe, expect, it } from "vitest";
import { createServiceLookup } from "./service-lookup";

describe("service lookup", () => {
	it("registers and gets", () => {
		const s = createServiceLookup();
		const off = s.register("id", 42);
		expect(s.get("id")).toBe(42);
		expect(s.has("id")).toBe(true);
		off();
		expect(s.has("id")).toBe(false);
	});

	it("rejects duplicate registration", () => {
		const s = createServiceLookup();
		s.register("id", 1);
		expect(() => s.register("id", 2)).toThrow();
	});

	it("throws when disposed", () => {
		const s = createServiceLookup();
		s.dispose();
		expect(() => s.register("id", 1)).toThrow();
	});

	it("subscribe returns noop when disposed", () => {
		const s = createServiceLookup();
		s.dispose();
		const off = s.subscribe(() => undefined);
		expect(typeof off).toBe("function");
	});

	it("dispose is idempotent", () => {
		const s = createServiceLookup();
		s.dispose();
		expect(() => s.dispose()).not.toThrow();
	});
});
