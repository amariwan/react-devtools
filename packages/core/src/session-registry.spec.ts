import { describe, expect, it } from "vitest";
import { createSessionRegistry } from "./session-registry";

describe("session registry", () => {
	it("creates registry", () => {
		const r = createSessionRegistry();
		expect(r.getSnapshot().status).toBe("available");
	});

	it("creates session", () => {
		const r = createSessionRegistry();
		r.register({
			sessionId: "ses_1",
			pageId: "page_1",
			connectedAtUnixMs: 1,
			stale: false,
		} as never);
		const s = r.getSnapshot().data.sessions[0];
		expect(s).toBeTruthy();
		expect(r.getSnapshot().data.sessions).toHaveLength(1);
	});
});
