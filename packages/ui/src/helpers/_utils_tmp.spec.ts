import { describe, expect, it } from "vitest";
import { cn } from "./_utils_tmp";

describe("utils tmp cn", () => {
	it("merges", () => {
		expect(cn("a", "b")).toContain("a");
	});
});
