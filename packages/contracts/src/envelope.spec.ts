import { describe, expect, it } from "vitest";
import type { DevtoolsEnvelope } from "./envelope";

describe("envelope type", () => {
	it("compiles", () => {
		const e: DevtoolsEnvelope<number> = {
			protocolVersion: 1,
			sessionId: "s",
			sequence: 1,
			timestampUnixMs: 1,
			event: "e",
			payload: 42,
		};
		expect(e.payload).toBe(42);
	});
});
