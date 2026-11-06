import { execFileSync } from "node:child_process";
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	NextDevtools,
	builtInPluginManifest,
	definePlugin,
	detectIntegration,
	loadBuiltInPlugins,
} from "next-devtools";
import { describe, expect, it } from "vitest";

describe("single public package", () => {
	it("has one publishable package and no internal runtime dependencies", () => {
		const manifest = JSON.parse(
			readFileSync(resolve(process.cwd(), "packages/next/package.json"), "utf8"),
		) as {
			name: string;
			private?: boolean;
			dependencies?: Record<string, string>;
		};
		expect(manifest.name).toBe("next-devtools");
		expect(manifest.private).not.toBe(true);
		expect(Object.keys(manifest.dependencies ?? {}).filter((name) =>
			name.startsWith("@next-devtools/"),
		)).toEqual([]);
	});

	it("creates the public package archive from the package workspace", () => {
		const packageDir = resolve(process.cwd(), "packages/next");
		const destination = mkdtempSync(join(tmpdir(), "next-devtools-pack-"));
		try {
			execFileSync("bun", ["pm", "pack", "--destination", destination], {
				cwd: packageDir,
				stdio: "pipe",
			});
			const archive = readdirSync(destination).find((name) =>
				name.endsWith(".tgz"),
			);
			expect(archive).toBeDefined();
			const manifest = JSON.parse(
				execFileSync(
					"tar",
					["-xOf", join(destination, archive!), "package/package.json"],
					{ encoding: "utf8" },
				),
			) as {
				name: string;
				private?: boolean;
				license?: string;
				dependencies?: Record<string, string>;
			};
		expect(manifest.name).toBe("next-devtools");
			expect(manifest.private).not.toBe(true);
			expect(manifest.license).toBe("MIT");
			expect(Object.values(manifest.dependencies ?? {})).not.toContain(
				"workspace:*",
			);
			const files = execFileSync("tar", ["-tzf", join(destination, archive!)], {
				encoding: "utf8",
			}).split("\n");
			expect(files.some((file) => file.startsWith("package/src/"))).toBe(false);
			expect(files.some((file) => file.endsWith("package/tsconfig.json"))).toBe(
				false,
			);
			expect(files.some((file) => file.includes("config.test"))).toBe(false);
			expect(files).toContain("package/README.md");
			expect(files).toContain("package/LICENSE");
		} finally {
			rmSync(destination, { recursive: true, force: true });
		}
	});

	it("installs the public package in an isolated local consumer", () => {
		const destination = mkdtempSync(join(tmpdir(), "next-devtools-consumer-"));
		const consumer = join(destination, "consumer");

		try {
			mkdirSync(consumer, { recursive: true });
			const archiveDir = mkdtempSync(join(tmpdir(), "next-devtools-archive-"));
			execFileSync("bun", ["pm", "pack", "--destination", archiveDir], {
				cwd: resolve(process.cwd(), "packages/next"),
				stdio: "pipe",
			});
			const archive = readdirSync(archiveDir).find((file) => file.endsWith(".tgz"));
			expect(archive).toBeDefined();
			const dependency = { "next-devtools": `file:${join(archiveDir, archive!)}` };
			writeFileSync(
				join(consumer, "package.json"),
				JSON.stringify(
					{
						name: "isolated-consumer",
						private: true,
						type: "module",
						dependencies: dependency,
						overrides: dependency,
					},
					null,
					2,
				),
			);
			execFileSync("bun", ["install", "--ignore-scripts"], {
				cwd: consumer,
				stdio: "pipe",
			});
			const imported = execFileSync(
				"bun",
				[
					"-e",
					"Promise.all([import('next-devtools'), import('next-devtools/server')]).then(([main, server]) => { if (typeof main.withNextDevtools !== 'function' || typeof server.createNextRequestErrorHandler !== 'function') process.exit(1) })",
				],
				{ cwd: consumer, encoding: "utf8" },
			);
			expect(imported).toBe("");
		} finally {
			rmSync(destination, { recursive: true, force: true });
		}
	});

	it("exposes the minimal integration API", () => {
		expect(typeof NextDevtools).toBe("function");
		expect(typeof definePlugin).toBe("function");
	});

	it("registers built-in plugins through a centralized manifest", () => {
		expect(Array.isArray(builtInPluginManifest)).toBe(true);
		expect(builtInPluginManifest.length).toBeGreaterThanOrEqual(9);
		const ids = builtInPluginManifest.map((e) => e.id);
		expect(ids).toContain("next-devtools.overview");
		expect(ids).toContain("next-devtools.components");
	});

	it("loads built-in plugins lazily", async () => {
		const plugins = await loadBuiltInPlugins();
		expect(Array.isArray(plugins)).toBe(true);
		expect(plugins.length).toBeGreaterThan(0);
		expect(
			plugins.every((p) => p.manifest && typeof p.setup === "function"),
		).toBe(true);
	});

	it("supports third-party plugin registration", () => {
		const plugin = definePlugin({
			manifest: {
				id: "third.party",
				version: "0.0.1",
				sdkRange: ">=0.0.0",
				displayName: "Third Party",
				targets: ["browser", "ui"],
				activation: "on-start",
			},
			setup() {},
		});
		expect(plugin.manifest.id).toBe("third.party");
	});

	it("detects optional integrations", async () => {
		const result = await detectIntegration("tailwindcss");
		expect(typeof result).toBe("boolean");
	});
});
