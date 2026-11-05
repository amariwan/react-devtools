import { describe, expect, it } from "vitest";
import { openInEditorAction } from "./actions";

describe("actions", () => {
	it("re-exports openInEditorAction", () => {
		expect(typeof openInEditorAction).toBe("function");
	});
});
