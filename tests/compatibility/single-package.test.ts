import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect } from "vitest";
import {
  NextDevtools,
  definePlugin,
  builtInPluginManifest,
  loadBuiltInPlugins,
  detectIntegration,
} from "@next-devtools/next";

describe("single public package", () => {
  it("has a publishable internal dependency closure", () => {
    const root = process.cwd();
    const packageFiles = ["packages", "plugins"].flatMap((group) =>
      readdirSync(resolve(root, group), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => resolve(root, group, entry.name, "package.json")),
    );
    const packages = new Map(
      packageFiles.map((file) => {
        const manifest = JSON.parse(readFileSync(file, "utf8")) as {
          name: string;
          private?: boolean;
          dependencies?: Record<string, string>;
        };
        return [manifest.name, manifest] as const;
      }),
    );
    const queue = ["@next-devtools/next"];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const name = queue.shift()!;
      if (visited.has(name)) continue;
      visited.add(name);
      const manifest =
        name === "@next-devtools/next"
          ? (JSON.parse(
              readFileSync(resolve(root, "packages/next/package.json"), "utf8"),
            ) as {
              name: string;
              private?: boolean;
              dependencies?: Record<string, string>;
            })
          : packages.get(name);
      if (!manifest) continue;
      expect(manifest.private, `${name} must be publishable`).not.toBe(true);
      for (const dependency of Object.keys(manifest.dependencies ?? {})) {
        if (dependency.startsWith("@next-devtools/")) queue.push(dependency);
      }
    }
    expect(visited).toContain("@next-devtools/plugin-components");
    expect(visited).toContain("@next-devtools/plugin-agent-mcp");
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
      expect(manifest.name).toBe("@next-devtools/next");
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
    const root = process.cwd();
    const destination = mkdtempSync(join(tmpdir(), "next-devtools-consumer-"));
    const mirror = join(destination, "mirror");
    const consumer = join(destination, "consumer");
    const packageFiles = ["packages", "plugins"].flatMap((group) =>
      readdirSync(resolve(root, group), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => resolve(root, group, entry.name, "package.json")),
    );
    const manifests = new Map(
      packageFiles.map((file) => {
        const manifest = JSON.parse(readFileSync(file, "utf8")) as {
          name: string;
          dependencies?: Record<string, string>;
        };
        return [manifest.name, { file, manifest }] as const;
      }),
    );
    const closure: string[] = [];
    const queue = ["@next-devtools/next"];
    while (queue.length > 0) {
      const name = queue.shift()!;
      if (closure.includes(name)) continue;
      const entry =
        name === "@next-devtools/next"
          ? {
              file: resolve(root, "packages/next/package.json"),
              manifest: JSON.parse(
                readFileSync(
                  resolve(root, "packages/next/package.json"),
                  "utf8",
                ),
              ) as { name: string; dependencies?: Record<string, string> },
            }
          : manifests.get(name);
      if (!entry) continue;
      closure.push(name);
      for (const dependency of Object.keys(entry.manifest.dependencies ?? {})) {
        if (dependency.startsWith("@next-devtools/")) queue.push(dependency);
      }
    }

    try {
      mkdirSync(mirror, { recursive: true });
      mkdirSync(consumer, { recursive: true });
      const archives = new Map<string, string>();
      for (const name of closure) {
        const entry =
          name === "@next-devtools/next"
            ? resolve(root, "packages/next")
            : resolve(manifests.get(name)!.file, "..");
        const before = new Set(readdirSync(mirror));
        execFileSync("bun", ["pm", "pack", "--destination", mirror], {
          cwd: entry,
          stdio: "pipe",
        });
        const archive = readdirSync(mirror).find(
          (file) => file.endsWith(".tgz") && !before.has(file),
        );
        expect(archive, `archive for ${name}`).toBeDefined();
        archives.set(name, join(mirror, archive!));
      }

      const dependencies = Object.fromEntries(
        closure.map((name) => [name, `file:${archives.get(name)}`]),
      );
      writeFileSync(
        join(consumer, "package.json"),
        JSON.stringify(
          {
            name: "isolated-consumer",
            private: true,
            type: "module",
            dependencies,
            overrides: dependencies,
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
          "Promise.all([import('@next-devtools/next'), import('@next-devtools/next/server')]).then(([main, server]) => { if (typeof main.withNextDevtools !== 'function' || typeof server.createNextRequestErrorHandler !== 'function') process.exit(1) })",
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
