import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  GENERATED_CONFIG,
  initProject,
  inspectProject,
  removeGeneratedConfig,
} from "../../packages/cli/src/project";

async function createProject() {
  const root = await mkdtemp(join(tmpdir(), "next-devtools-cli-"));
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      dependencies: { next: "16.0.0", "@next-devtools/next": "0.0.0" },
    }),
  );
  await mkdir(join(root, "src/app"), { recursive: true });
  return root;
}

describe("CLI project helpers", () => {
  it("reports a configured project", async () => {
    const root = await createProject();
    await writeFile(
      join(root, "next.config.mjs"),
      "export default withNextDevtools({});",
    );
    const report = inspectProject(root);
    expect(report.ok).toBe(true);
    expect(
      report.checks.find((check) => check.name === "DevTools integration")
        ?.status,
    ).toBe("pass");
  });

  it("previews and creates only a missing config", async () => {
    const root = await createProject();
    expect(initProject(root).action).toBe("preview");
    expect(initProject(root).message).toBe(GENERATED_CONFIG);
    expect(initProject(root, true).action).toBe("created");
    await expect(readFile(join(root, "next.config.mjs"), "utf8")).resolves.toBe(
      GENERATED_CONFIG,
    );
  });

  it("does not remove a user-owned config", async () => {
    const root = await createProject();
    await writeFile(join(root, "next.config.mjs"), "export default {};\n");
    expect(removeGeneratedConfig(root).removed).toBe(false);
    await expect(readFile(join(root, "next.config.mjs"), "utf8")).resolves.toBe(
      "export default {};\n",
    );
  });

  it("removes the exact generated config", async () => {
    const root = await createProject();
    initProject(root, true);
    expect(removeGeneratedConfig(root).removed).toBe(true);
  });
});
