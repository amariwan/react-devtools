import { describe, expect, it } from "vitest";
import { createStateStore } from "./state-store";

describe("state store", () => {
	it("stores and retrieves values", () => {
		const s = createStateStore();
		s.set("a", 42);
		expect(s.get("a")).toBe(42);
	});

	it("deletes values", () => {
		const s = createStateStore();
		s.set("a", 1);
		s.delete("a");
		expect(s.get("a")).toBeUndefined();
	});

	it("namespaces isolate keys", () => {
		const s = createStateStore();
		const ns = s.namespace("x");
		ns.set("a", 7);
		expect(s.get("a")).toBeUndefined();
		expect(ns.get("a")).toBe(7);
		expect(s.get("x:a")).toBe(7);
	});
});
