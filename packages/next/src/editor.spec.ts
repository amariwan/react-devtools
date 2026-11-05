import { describe, expect, it } from "vitest";
import { createOpenInEditorHandler } from "./editor";

describe("editor handler", () => {
	it("creates handler", () => {
		const h = createOpenInEditorHandler();
		expect(typeof h).toBe("function");
	});
});
