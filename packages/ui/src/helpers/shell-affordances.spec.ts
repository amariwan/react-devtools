import { describe, expect, it } from "vitest";
import { pickActivePanelId, resolveShellShortcut } from "./shell-affordances";

describe("shell affordances", () => {
	it("resolves shortcuts", () => {
		expect(
			resolveShellShortcut({
				key: "k",
				metaKey: true,
				open: false,
				overlayOpen: false,
			}),
		).toBe("open-devtools");
		expect(
			resolveShellShortcut({ key: "Escape", open: true, overlayOpen: false }),
		).toBe("close-devtools");
	});

	it("picks active panel", () => {
		expect(pickActivePanelId([{ id: "a" }, { id: "b" }], "b")).toBe("b");
		expect(pickActivePanelId([{ id: "a" }], "z")).toBe("a");
		expect(pickActivePanelId([], null)).toBeNull();
	});
});
