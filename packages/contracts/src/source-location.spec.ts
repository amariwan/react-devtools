import { describe, expect, it } from "vitest";
import type { SourceLocation } from "./source-location";

describe("source location type", () => {
	it("compiles", () => {
		const s: SourceLocation = {
			workspaceRelativePath: "a.ts",
			line: 1,
			column: 1,
			origin: "react-debug",
			confidence: "exact",
		};
		expect(s.line).toBe(1);
	});
});
