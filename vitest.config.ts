import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@next-devtools/contracts": path.resolve(
        repoRoot,
        "packages/contracts/src/index.ts",
      ),
      "@next-devtools/plugin-sdk": path.resolve(
        repoRoot,
        "packages/plugin-sdk/src/index.ts",
      ),
      "@next-devtools/core": path.resolve(
        repoRoot,
        "packages/core/src/index.ts",
      ),
      "@next-devtools/host-next/editor": path.resolve(
        repoRoot,
        "packages/host-next/src/editor-bridge.ts",
      ),
      "@next-devtools/host-next/route-scanner": path.resolve(
        repoRoot,
        "packages/host-next/src/route-scanner.ts",
      ),
      "@next-devtools/host-next/route-runtime": path.resolve(
        repoRoot,
        "packages/host-next/src/route-runtime.ts",
      ),
      "@next-devtools/host-next/dev-guard": path.resolve(
        repoRoot,
        "packages/host-next/src/dev-guard.ts",
      ),
      "@next-devtools/host-next/open-in-editor-action": path.resolve(
        repoRoot,
        "packages/host-next/src/open-in-editor-action.ts",
      ),
      "@next-devtools/host-next": path.resolve(
        repoRoot,
        "packages/host-next/src/index.ts",
      ),
      "@next-devtools/runtime-react": path.resolve(
        repoRoot,
        "packages/runtime-react/src/index.ts",
      ),
      "@next-devtools/source-inspector": path.resolve(
        repoRoot,
        "packages/source-inspector/src/index.ts",
      ),
      "@next-devtools/ui": path.resolve(repoRoot, "packages/ui/src/index.ts"),
      "@next-devtools/next/server": path.resolve(
        repoRoot,
        "packages/next/src/server.ts",
      ),
      "@next-devtools/next": path.resolve(
        repoRoot,
        "packages/next/src/index.ts",
      ),
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
  },
});
