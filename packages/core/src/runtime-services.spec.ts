import { describe, expect, it } from "vitest";
import { createCoreRuntimeServices } from "./runtime-services";

describe("runtime services", () => {
	it("creates services", () => {
		const s = createCoreRuntimeServices();
		expect(s.timeline).toBeTruthy();
		expect(s.sessions).toBeTruthy();
		expect(s.network).toBeTruthy();
		expect(s.stores).toBeTruthy();
		expect(s.diagnostics).toBeTruthy();
		s.dispose();
	});
});
