import { describe, expect, it } from "vitest";
import {
	buildEditorCommand,
	isEditorTarget,
	validateEditorPath,
} from "./source-resolver";

describe("source resolver", () => {
	it("validates empty path", () => {
		expect(validateEditorPath("", ["/root"]).ok).toBe(false);
	});

	it("rejects traversal", () => {
		expect(validateEditorPath("../secret", ["/root"]).ok).toBe(false);
	});

	it("accepts relative under root", () => {
		const r = validateEditorPath("src/a.ts", ["src"]);
		expect(r.ok).toBe(true);
	});

	it("validates editor target", () => {
		expect(isEditorTarget("vscode")).toBe(true);
		expect(isEditorTarget("nope")).toBe(false);
	});

	it("builds editor command", () => {
		const cmd = buildEditorCommand("vscode", {
			file: "a.ts",
			line: 1,
			column: 2,
		});
		expect(cmd.executable).toBe("code");
	});
});
