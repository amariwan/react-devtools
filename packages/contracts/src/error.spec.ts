import { describe, expect, it } from "vitest";
import type { DiagnosticError } from "./error";

describe("error type", () => {
	it("compiles", () => {
		const e: DiagnosticError = { code: "X", message: "m", retryable: false };
		expect(e.code).toBe("X");
	});
});
