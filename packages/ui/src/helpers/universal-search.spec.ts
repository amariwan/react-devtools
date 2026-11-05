import { describe, expect, it } from "vitest";
import { buildUniversalSearchEntries } from "./universal-search";

describe("universal search", () => {
	it("builds entries", () => {
		const entries = buildUniversalSearchEntries({} as never);
		expect(Array.isArray(entries)).toBe(true);
	});
});
