import { lstat, readdir, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const ignoredDirectories = new Set([".next", "node_modules"]);
const routeFilePattern =
  /^(page|layout|template|loading|error|global-error|not-found|default|route|proxy|middleware)\.(?:[cm]?[jt]sx?|mdx?)$/;

function isInside(root: string, target: string): boolean {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

export async function discoverAppRouterFiles(options: {
  projectRoot: string;
  appRoot: string;
}): Promise<string[]> {
  const projectRoot = await realpath(resolve(options.projectRoot));
  const requestedAppRoot = resolve(projectRoot, options.appRoot);
  if (!isInside(projectRoot, requestedAppRoot)) {
    throw new Error("App root must be inside project root");
  }
  const rootStat = await lstat(requestedAppRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error("App root must not be a symbolic link");
  }
  const appRoot = await realpath(requestedAppRoot);
  if (!isInside(projectRoot, appRoot)) {
    throw new Error("App root must be inside project root");
  }

  const files: string[] = [];
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) await visit(absolutePath);
        continue;
      }
      if (!entry.isFile() || !routeFilePattern.test(entry.name)) continue;
      files.push(relative(projectRoot, absolutePath).split(sep).join("/"));
    }
  }

  await visit(appRoot);
  return files.sort();
}

import { readdirSync, lstatSync, realpathSync } from "node:fs";
import { readFileSync } from "node:fs";
import type { RouteFileMetadata } from "./route-scanner.js";

export function discoverAppRouterFilesSync(options: {
  projectRoot: string;
  appRoot: string;
}): string[] {
  const projectRoot = realpathSync(resolve(options.projectRoot));
  const requestedAppRoot = resolve(projectRoot, options.appRoot);
  if (!isInside(projectRoot, requestedAppRoot)) {
    throw new Error("App root must be inside project root");
  }
  const rootStat = lstatSync(requestedAppRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error("App root must not be a symbolic link");
  }
  const appRoot = realpathSync(requestedAppRoot);
  if (!isInside(projectRoot, appRoot)) {
    throw new Error("App root must be inside project root");
  }

  const files: string[] = [];
  function visit(directory: string): void {
    const entries = readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const absolutePath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) visit(absolutePath);
        continue;
      }
      if (!entry.isFile() || !routeFilePattern.test(entry.name)) continue;
      files.push(relative(projectRoot, absolutePath).split(sep).join("/"));
    }
  }

  visit(appRoot);
  return files.sort();
}

export function discoverAppRouterMetadataSync(options: {
  projectRoot: string;
  appRoot: string;
}): Record<string, RouteFileMetadata> {
  const files = discoverAppRouterFilesSync(options);
  const metadata: Record<string, RouteFileMetadata> = {};
  for (const file of files) {
    try {
      const source = readFileSync(resolve(options.projectRoot, file), "utf8");
      const header = source.split(/\r?\n/, 20).join("\n");
      metadata[file] = {
        execution: /^\s*["']use client["']/m.test(header) ? "client" : "server",
      };
    } catch {
      metadata[file] = { execution: "unknown" };
    }
  }
  return metadata;
}

export function detectAppRootSync(projectRoot: string): string | null {
  for (const candidate of ["src/app", "app"]) {
    try {
      const stat = lstatSync(resolve(projectRoot, candidate));
      if (stat.isDirectory() && !stat.isSymbolicLink()) return candidate;
    } catch {
      /* not present */
    }
  }
  return null;
}
