import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const GENERATED_CONFIG = `/* next-devtools:init:start */
import { withNextDevtools } from "@next-devtools/next";

const nextConfig = {};

export default withNextDevtools(nextConfig);
/* next-devtools:init:end */
`;

const CONFIG_FILES = [
  "next.config.ts",
  "next.config.mts",
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
  "next.config.cts",
] as const;

export type ProjectCheck = {
  readonly name: string;
  readonly status: "pass" | "warn" | "fail";
  readonly detail: string;
};

export type DoctorReport = {
  readonly root: string;
  readonly checks: readonly ProjectCheck[];
  readonly ok: boolean;
};

function readPackage(root: string): Record<string, unknown> | null {
  try {
    return JSON.parse(
      readFileSync(join(root, "package.json"), "utf8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function dependencyPresent(
  packageJson: Record<string, unknown> | null,
  name: string,
): boolean {
  return ["dependencies", "devDependencies", "peerDependencies"].some(
    (section) => {
      const value = packageJson?.[section];
      return (
        typeof value === "object" &&
        value !== null &&
        name in (value as Record<string, unknown>)
      );
    },
  );
}

export function findProjectRoot(start = process.cwd()): string | null {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "package.json"))) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function findNextConfig(root: string): string | null {
  return (
    CONFIG_FILES.map((name) => join(root, name)).find((path) =>
      existsSync(path),
    ) ?? null
  );
}

export function inspectProject(root: string): DoctorReport {
  const packageJson = readPackage(root);
  const configPath = findNextConfig(root);
  const config = configPath ? readFileSync(configPath, "utf8") : "";
  const hasNext = dependencyPresent(packageJson, "next");
  const hasDevtools = dependencyPresent(packageJson, "@next-devtools/next");
  const hasAppRoot = ["src/app", "app"].some((path) =>
    existsSync(join(root, path)),
  );
  const checks: ProjectCheck[] = [
    {
      name: "package.json",
      status: packageJson ? "pass" : "fail",
      detail: packageJson
        ? "Found project manifest"
        : "Missing project manifest",
    },
    {
      name: "Next.js",
      status: hasNext ? "pass" : "fail",
      detail: hasNext
        ? "Next.js dependency is declared"
        : "Next.js dependency is missing",
    },
    {
      name: "App Router",
      status: hasAppRoot ? "pass" : "warn",
      detail: hasAppRoot
        ? "app/ or src/app/ found"
        : "No app/ or src/app/ directory found",
    },
    {
      name: "next.config",
      status: configPath ? "pass" : "warn",
      detail: configPath
        ? `Found ${configPath.slice(root.length + 1)}`
        : "No Next.js config found",
    },
    {
      name: "DevTools integration",
      status: config.includes("withNextDevtools") ? "pass" : "warn",
      detail: config.includes("withNextDevtools")
        ? "withNextDevtools() is configured"
        : "withNextDevtools() is not present in the Next.js config",
    },
    {
      name: "Public package",
      status: hasDevtools ? "pass" : "warn",
      detail: hasDevtools
        ? "@next-devtools/next is declared"
        : "Declare @next-devtools/next before starting Next.js",
    },
  ];
  return { root, checks, ok: checks.every((check) => check.status !== "fail") };
}

export function initProject(root: string, write = false) {
  const existingConfig = findNextConfig(root);
  if (existingConfig) {
    const configured = readFileSync(existingConfig, "utf8").includes(
      "withNextDevtools",
    );
    return {
      root,
      configPath: existingConfig,
      action: configured
        ? ("already-configured" as const)
        : ("manual" as const),
      message: configured
        ? "withNextDevtools() is already configured."
        : `Edit ${existingConfig} and wrap the exported config with withNextDevtools().`,
    };
  }
  const configPath = join(root, "next.config.mjs");
  if (!write)
    return {
      root,
      configPath,
      action: "preview" as const,
      message: GENERATED_CONFIG,
    };
  writeFileSync(configPath, GENERATED_CONFIG, "utf8");
  return {
    root,
    configPath,
    action: "created" as const,
    message: `Created ${configPath}. Declare @next-devtools/next before running Next.js.`,
  };
}

export function removeGeneratedConfig(root: string) {
  const path = join(root, "next.config.mjs");
  if (!existsSync(path) || readFileSync(path, "utf8") !== GENERATED_CONFIG) {
    return {
      removed: false,
      path,
      message:
        "No CLI-generated config found; existing configuration was left untouched.",
    };
  }
  unlinkSync(path);
  return { removed: true, path, message: `Removed ${path}.` };
}
