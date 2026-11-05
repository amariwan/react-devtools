import { describe, expect, it } from "vitest";
import {
	spawnEditorAndWait,
	validateCanonicalEditorPath,
} from "./editor-bridge";

describe("editor bridge", () => {
	it("resolves on spawn", async () => {
		const spawnEditor = (
			_e: string,
			_a: string[],
			events: { spawn(): void; error(e: Error): void },
		) => {
			events.spawn();
		};
		const r = await spawnEditorAndWait(
			"code",
			["--goto", "a.ts:1:1"],
			spawnEditor,
		);
		expect(r.ok).toBe(true);
	});

	it("resolves on error", async () => {
		const spawnEditor = (
			_e: string,
			_a: string[],
			events: { spawn(): void; error(e: Error): void },
		) => {
			events.error(new Error("not found"));
		};
		const r = await spawnEditorAndWait("code", [], spawnEditor);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("not found");
	});

	it("handles spawn throw", async () => {
		const spawnEditor = () => {
			throw new Error("spawn failed");
		};
		const r = await spawnEditorAndWait("code", [], spawnEditor as never);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.reason).toBe("spawn failed");
	});

	it("validates canonical path", async () => {
		const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
		const { join } = await import("node:path");
		const { tmpdir } = await import("node:os");
		const root = mkdtempSync(join(tmpdir(), "eb-"));
		const file = join(root, "a.txt");
		writeFileSync(file, "x");
		const r = await validateCanonicalEditorPath(file, [root]);
		expect(r.ok).toBe(true);
		rmSync(root, { recursive: true, force: true });
	});

	it("rejects outside workspace", async () => {
		const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
		const { join } = await import("node:path");
		const { tmpdir } = await import("node:os");
		const root = mkdtempSync(join(tmpdir(), "eb-"));
		const other = mkdtempSync(join(tmpdir(), "eb2-"));
		const file = join(other, "a.txt");
		writeFileSync(file, "x");
		const r = await validateCanonicalEditorPath(file, [root]);
		expect(r.ok).toBe(false);
		rmSync(root, { recursive: true, force: true });
		rmSync(other, { recursive: true, force: true });
	});
});
