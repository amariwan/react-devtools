/* global URL, console, process */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const mode = process.argv[2] ?? "all";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const packageDirs = ["packages", "plugins"].flatMap((group) =>
  readdirSync(join(root, group), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, group, entry.name)),
);
const entries = packageDirs.map((dir) => ({
  dir,
  manifest: readJson(join(dir, "package.json")),
}));

function validateMetadata() {
  const names = new Set();
  for (const { dir, manifest } of entries) {
    if (names.has(manifest.name))
      throw new Error(`Duplicate package: ${manifest.name}`);
    names.add(manifest.name);
    if (
      !manifest.version ||
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)
    ) {
      throw new Error(`${manifest.name}: invalid version ${manifest.version}`);
    }
    if (manifest.private !== true && manifest.license !== "MIT") {
      throw new Error(
        `${manifest.name}: public packages must declare MIT license`,
      );
    }
    if (
      manifest.private !== true &&
      manifest.files &&
      !manifest.files.includes("dist")
    ) {
      throw new Error(`${manifest.name}: public packages must publish dist`);
    }
    if (manifest.private === true && manifest.name === "@next-devtools/next") {
      throw new Error(
        `${manifest.name}: public entry package cannot be private`,
      );
    }
    if (!manifest.private && manifest.dependencies) {
      for (const [dependency, range] of Object.entries(manifest.dependencies)) {
        if (
          dependency.startsWith("@next-devtools/") &&
          range !== "workspace:*"
        ) {
          throw new Error(
            `${manifest.name}: internal dependency ${dependency} must use workspace:* before packing`,
          );
        }
      }
    }
    if (!dir) throw new Error("unreachable");
  }
  const changesets = readJson(join(root, ".changeset", "config.json"));
  if (changesets.baseBranch !== "main")
    throw new Error("Changesets baseBranch must be main");
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
  if (!/^## \[Unreleased\]/m.test(changelog))
    throw new Error("CHANGELOG.md needs an Unreleased section");
  console.log(`metadata: PASS (${entries.length} workspace packages)`);
}

function validateArchives() {
  const destination = mkdtempSync(join(tmpdir(), "next-devtools-release-"));
  try {
    for (const { dir, manifest } of entries.filter(
      ({ manifest }) => !manifest.private,
    )) {
      execFileSync("bun", ["pm", "pack", "--destination", destination], {
        cwd: dir,
        stdio: "pipe",
      });
      const archive = readdirSync(destination)
        .filter((name) => name.endsWith(".tgz"))
        .sort()
        .at(-1);
      if (!archive)
        throw new Error(`${manifest.name}: bun pm pack produced no archive`);
      const archivePath = join(destination, archive);
      const packed = JSON.parse(
        execFileSync("tar", ["-xOf", archivePath, "package/package.json"], {
          encoding: "utf8",
        }),
      );
      if (packed.private === true || packed.license !== "MIT")
        throw new Error(`${manifest.name}: invalid packed metadata`);
      if (
        Object.values({
          ...packed.dependencies,
          ...packed.optionalDependencies,
        }).some((value) => value === "workspace:*")
      ) {
        throw new Error(
          `${manifest.name}: packed archive contains workspace:* dependency`,
        );
      }
      const files = execFileSync("tar", ["-tzf", archivePath], {
        encoding: "utf8",
      });
      for (const forbidden of ["/src/", "/tsconfig.json", ".test."]) {
        if (files.includes(`package${forbidden}`))
          throw new Error(`${manifest.name}: archive contains ${forbidden}`);
      }
    }
    console.log(
      `archives: PASS (${entries.filter(({ manifest }) => !manifest.private).length} public packages)`,
    );
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
}

if (mode === "metadata" || mode === "all") validateMetadata();
if (mode === "packages" || mode === "all") validateArchives();
if (!new Set(["metadata", "packages", "all"]).has(mode)) {
  throw new Error(`Unknown mode ${mode}; use metadata, packages, or all`);
}
