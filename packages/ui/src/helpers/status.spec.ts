import { describe, expect, it } from "vitest";
import { STATUS_LABELS, STATUS_TONES, statusTone } from "./status";

describe("status", () => {
	it("maps status tones", () => {
		expect(statusTone("available")).toBe("available");
		expect(statusTone("error")).toBe("error");
		expect(statusTone("unknown")).toBe("unavailable");
	});

	it("has labels for all tones", () => {
		for (const t of STATUS_TONES) expect(STATUS_LABELS[t]).toBeTruthy();
	});
});
