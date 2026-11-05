import { describe, expect, it } from "vitest";
import { fuzzyFilter, fuzzyScore } from "./fuzzy";

describe("fuzzy", () => {
	it("returns null for non-subsequence", () => {
		expect(fuzzyScore("xyz", "abc")).toBeNull();
	});

	it("scores empty query zero", () => {
		expect(fuzzyScore("", "anything")).toBe(0);
	});

	it("filters and ranks items", () => {
		const items = ["apple", "application", "banana"];
		const res = fuzzyFilter("app", items, (x) => x);
		expect(res.map((r) => r.item)).toContain("apple");
		expect(res.map((r) => r.item)).toContain("application");
		expect(res.map((r) => r.item)).not.toContain("banana");
	});
});
