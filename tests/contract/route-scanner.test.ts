import { describe, it, expect } from "vitest";
import { scanAppRouter, buildUrlPattern } from "@next-devtools/host-next";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  discoverAppRouterFiles,
  discoverAppRouterMetadataSync,
} from "../../packages/host-next/src/route-index-server.js";

describe("route scanner", () => {
  it("classifies static + group + dynamic", () => {
    const files = [
      "app/layout.tsx",
      "app/page.tsx",
      "app/blog/layout.tsx",
      "app/blog/page.tsx",
      "app/blog/[slug]/page.tsx",
    ];
    const tree = scanAppRouter(files);
    const slugs = tree.nodes.find((n) => n.name === "[slug]");
    expect(slugs?.kind).toBe("dynamic");
    expect(slugs?.dynamicParamNames).toEqual(["slug"]);
    const blog = tree.nodes.find((n) => n.name === "blog");
    expect(blog?.kind).toBe("static");
    expect(buildUrlPattern(slugs!, tree.nodes)).toBe("/blog/[slug]");
  });

  it("handles route groups without url segment", () => {
    const files = [
      "app/(marketing)/about/page.tsx",
      "app/(marketing)/layout.tsx",
    ];
    const tree = scanAppRouter(files);
    const group = tree.nodes.find((n) => n.name === "(marketing)");
    expect(group?.kind).toBe("group");
    const about = tree.nodes.find((n) => n.name === "about");
    expect(buildUrlPattern(about!, tree.nodes)).toBe("/about");
  });

  it("handles catch-all and optional catch-all", () => {
    const files = [
      "app/docs/[...slug]/page.tsx",
      "app/shop/[[...slug]]/page.tsx",
    ];
    const tree = scanAppRouter(files);
    const catchAll = tree.nodes.find((n) => n.name === "[...slug]");
    expect(catchAll?.kind).toBe("catch-all");
    const opt = tree.nodes.find((n) => n.name === "[[...slug]]");
    expect(opt?.kind).toBe("optional-catch-all");
  });

  it("handles parallel slots", () => {
    const files = ["app/@modal/default.tsx", "app/page.tsx"];
    const tree = scanAppRouter(files);
    const slot = tree.nodes.find((n) => n.name === "@modal");
    expect(slot?.kind).toBe("parallel-slot");
    expect(slot?.parallelSlot).toBe("modal");
  });

  it("handles intercepting routes", () => {
    const files = ["app/feed/(.)photo/[id]/page.tsx"];
    const tree = scanAppRouter(files);
    // the segment name includes intercept prefix
    const intercept = tree.nodes.find((n) => n.isIntercepted);
    expect(intercept).toBeDefined();
    expect(intercept?.interceptPrefix).toBe(".");
  });

  it("file roles", () => {
    const files = [
      "app/error.tsx",
      "app/loading.tsx",
      "app/not-found.tsx",
      "app/global-error.tsx",
      "app/route.ts",
    ];
    const tree = scanAppRouter(files);
    const root = tree.nodes.find((n) => n.id === "__root__");
    expect(root?.fileRoles).toContain("error");
    expect(root?.fileRoles).toContain("loading");
    expect(root?.fileRoles).toContain("not-found");
    expect(root?.fileRoles).toContain("global-error");
    expect(root?.fileRoles).toContain("route");
  });

  it("src/app support via appRoot param", () => {
    const files = ["src/app/page.tsx", "src/app/about/page.tsx"];
    const tree = scanAppRouter(files, "src/app");
    expect(tree.nodes.find((n) => n.name === "about")).toBeDefined();
  });

  it("keeps static server/client execution metadata separate from route shape", () => {
    const tree = scanAppRouter(
      ["src/app/page.tsx", "src/app/dashboard/page.tsx"],
      "src/app",
      {
        "src/app/page.tsx": { execution: "server" },
        "src/app/dashboard/page.tsx": { execution: "client" },
      },
    );

    expect(tree.nodes.find((node) => node.id === "__root__")?.execution).toBe(
      "server",
    );
    expect(tree.nodes.find((node) => node.id === "dashboard")?.execution).toBe(
      "client",
    );
  });

  it("ignores traversal-shaped input paths", () => {
    const tree = scanAppRouter([
      "app/../outside/page.tsx",
      "app/safe/page.tsx",
    ]);

    expect(tree.nodes.some((node) => node.relativePath.includes(".."))).toBe(
      false,
    );
    expect(tree.nodes.find((node) => node.name === "safe")).toBeDefined();
  });

  it("discovers sorted route files without following symlinks or build directories", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "next-devtools-routes-"));
    await mkdir(join(projectRoot, "src/app/blog"), { recursive: true });
    await mkdir(join(projectRoot, "src/app/.next/private"), {
      recursive: true,
    });
    await mkdir(join(projectRoot, "src/app/node_modules/pkg"), {
      recursive: true,
    });
    await mkdir(join(projectRoot, "outside"), { recursive: true });
    await writeFile(join(projectRoot, "src/app/layout.tsx"), "");
    await writeFile(
      join(projectRoot, "src/app/blog/page.tsx"),
      '"use client";\n',
    );
    await writeFile(join(projectRoot, "src/app/blog/template.tsx"), "");
    await writeFile(join(projectRoot, "src/app/.next/private/page.tsx"), "");
    await writeFile(join(projectRoot, "src/app/node_modules/pkg/page.tsx"), "");
    await writeFile(join(projectRoot, "outside/page.tsx"), "");
    await symlink(
      join(projectRoot, "outside"),
      join(projectRoot, "src/app/linked"),
    );

    await expect(
      discoverAppRouterFiles({ projectRoot, appRoot: "src/app" }),
    ).resolves.toEqual([
      "src/app/blog/page.tsx",
      "src/app/blog/template.tsx",
      "src/app/layout.tsx",
    ]);
    expect(
      discoverAppRouterMetadataSync({ projectRoot, appRoot: "src/app" })[
        "src/app/blog/page.tsx"
      ],
    ).toEqual({ execution: "client" });
  });

  it("rejects app roots outside the project", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "next-devtools-project-"));
    const outsideRoot = await mkdtemp(join(tmpdir(), "next-devtools-outside-"));

    await expect(
      discoverAppRouterFiles({ projectRoot, appRoot: outsideRoot }),
    ).rejects.toThrow(/inside project root/);
  });

  it("rejects a missing outside root before accessing it", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "next-devtools-project-"));
    const outsideRoot = `${projectRoot}-missing-outside`;

    await expect(
      discoverAppRouterFiles({ projectRoot, appRoot: outsideRoot }),
    ).rejects.toThrow(/inside project root/);
  });
});
