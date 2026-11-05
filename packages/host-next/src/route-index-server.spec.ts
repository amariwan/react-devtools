import { describe, expect, it } from "vitest";
import {
	detectAppRootSync,
	discoverAppRouterFilesSync,
} from "./route-index-server";

describe("route index server", () => {
	it("detects app root null for empty dir", () => {
		const tmp = "/tmp/nonexistent-project-xyz";
		expect(detectAppRootSync(tmp)).toBeNull();
	});

	it("discovers files in a temp app", async () => {
		const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import(
			"node:fs"
		);
		const { join } = await import("node:path");
		const { tmpdir } = await import("node:os");
		const root = mkdtempSync(join(tmpdir(), "rt-"));
		mkdirSync(join(root, "app"), { recursive: true });
		writeFileSync(
			join(root, "app", "page.tsx"),
			"export default function P(){}",
		);
		const files = discoverAppRouterFilesSync({
			projectRoot: root,
			appRoot: "app",
		});
		expect(files).toContain("app/page.tsx");
		rmSync(root, { recursive: true, force: true });
	});
});
