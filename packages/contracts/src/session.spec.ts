import { describe, expect, it } from "vitest";
import { isSessionId, newPageId, newSessionId } from "./session";

describe("session ids", () => {
	it("generates session id with prefix", () => {
		const id = newSessionId();
		expect(id.startsWith("ses_")).toBe(true);
		expect(isSessionId(id)).toBe(true);
	});

	it("generates page id with prefix", () => {
		expect(newPageId().startsWith("page_")).toBe(true);
	});

	it("validates session id", () => {
		expect(isSessionId("ses_abc")).toBe(true);
		expect(isSessionId("page_abc")).toBe(false);
		expect(isSessionId(42)).toBe(false);
	});
});
