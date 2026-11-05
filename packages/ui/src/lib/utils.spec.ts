import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("utils cn", () => {
	it("merges classes", () => {
		expect(cn("a", "b")).toContain("a");
		expect(cn("a", false && "b", "c")).toContain("c");
	});
});
