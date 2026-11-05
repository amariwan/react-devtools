import { describe, expect, it } from "vitest";
import { findNextConfig, findProjectRoot, inspectProject } from "./project";

describe("cli project", () => {
	it("finds project root from cwd", () => {
		const root = findProjectRoot(process.cwd());
		expect(root).toBeTruthy();
	});

	it("inspects project", () => {
		const root = findProjectRoot(process.cwd())!;
		const report = inspectProject(root);
		expect(report).toBeTruthy();
	});

	it("finds next config", () => {
		const root = findProjectRoot(process.cwd())!;
		const cfg = findNextConfig(root);
		expect(cfg === null || typeof cfg === "string").toBe(true);
	});
});
