import { describe, it, expect } from "vitest";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildEditorCommand,
  resolveElementSource,
  resolveSourceLocation,
  validateEditorPath,
} from "@next-devtools/source-inspector";
import {
  openInEditor,
  spawnEditorAndWait,
  validateCanonicalEditorPath,
} from "../../packages/host-next/src/editor-bridge.js";

describe("source resolver", () => {
  it("labels Fiber source as a definition location", async () => {
    const element = {
      __reactFiber$test: {
        type: { name: "Button" },
        _debugSource: {
          fileName: "src/Button.tsx",
          lineNumber: 8,
          columnNumber: 3,
        },
      },
    };

    await expect(resolveElementSource(element as never)).resolves.toMatchObject(
      {
        origin: "fiber-definition",
        role: "component-definition",
        componentName: "Button",
        filePath: "src/Button.tsx",
      },
    );
  });

  it("priority react-debug first", () => {
    const loc = resolveSourceLocation({
      reactDebugSource: { file: "a.tsx", line: 1, column: 2 },
      compileAttribute: { file: "b.tsx", line: 3, column: 4 },
    });
    expect(loc?.origin).toBe("react-debug");
    expect(loc?.confidence).toBe("exact");
  });

  it("falls back to compile-attribute", () => {
    const loc = resolveSourceLocation({
      reactDebugSource: null,
      compileAttribute: { file: "b.tsx", line: 3, column: 4 },
    });
    expect(loc?.origin).toBe("compile-attribute");
    expect(loc?.confidence).toBe("derived");
  });

  it("falls back to static-index", () => {
    const loc = resolveSourceLocation({
      reactDebugSource: null,
      compileAttribute: null,
      staticIndex: { file: "c.tsx", line: 5, column: 6 },
    });
    expect(loc?.origin).toBe("static-index");
    expect(loc?.confidence).toBe("approximate");
  });

  it("returns null when none", () => {
    expect(resolveSourceLocation({})).toBeNull();
  });
});

describe("path validation", () => {
  const roots = ["src", "app"];

  it("allows inside workspace", () => {
    expect(validateEditorPath("src/foo.tsx", roots)).toEqual({
      ok: true,
      canonical: "src/foo.tsx",
    });
  });

  it("rejects traversal", () => {
    expect(validateEditorPath("src/../etc/passwd", roots).ok).toBe(false);
  });

  it("rejects absolute", () => {
    expect(validateEditorPath("/etc/passwd", roots).ok).toBe(false);
  });

  it("rejects absolute paths that only contain the workspace root as a substring", () => {
    expect(validateEditorPath("/tmp/work/src/file.tsx", ["/work/src"])).toEqual(
      { ok: false, reason: "outside_workspace" },
    );
    expect(validateEditorPath("/work/src/file.tsx", ["/work/src"])).toEqual({
      ok: true,
      canonical: "/work/src/file.tsx",
    });
  });

  it("rejects outside workspace", () => {
    expect(validateEditorPath("other/foo.tsx", roots).ok).toBe(false);
  });

  it("rejects null byte", () => {
    expect(validateEditorPath("src/\0foo", roots).ok).toBe(false);
  });

  it("rejects uri scheme", () => {
    expect(validateEditorPath("file:///etc/passwd", roots).ok).toBe(false);
  });
});

describe("editor commands", () => {
  it("reports an asynchronous missing-editor error instead of returning success", async () => {
    await expect(
      spawnEditorAndWait("missing-editor", [], (_executable, _args, events) => {
        queueMicrotask(() => events.error(new Error("ENOENT")));
      }),
    ).resolves.toEqual({ ok: false, reason: "ENOENT" });
  });

  it("rejects symlink escapes after canonicalizing workspace paths", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "next-devtools-editor-"));
    const workspaceRoot = join(projectRoot, "src");
    const outsideRoot = join(projectRoot, "outside");
    await mkdir(workspaceRoot);
    await mkdir(outsideRoot);
    await writeFile(join(outsideRoot, "secret.ts"), "secret");
    await symlink(outsideRoot, join(workspaceRoot, "linked"));

    await expect(
      validateCanonicalEditorPath(join(workspaceRoot, "linked/secret.ts"), [
        workspaceRoot,
      ]),
    ).resolves.toEqual({ ok: false, reason: "outside_workspace" });
  });

  it.each([
    ["vscode", { executable: "code", args: ["--goto", "src/app.tsx:7:9"] }],
    ["cursor", { executable: "cursor", args: ["--goto", "src/app.tsx:7:9"] }],
  ] as const)("builds shell-free %s arguments", (editor, expected) => {
    expect(
      buildEditorCommand(editor, { file: "src/app.tsx", line: 7, column: 9 }),
    ).toEqual(expected);
  });

  it.each(["vim", "zed", "jetbrains", ""])(
    "rejects unsupported editor targets %s",
    (editor) => {
      expect(() =>
        buildEditorCommand(editor as never, {
          file: "src/app.tsx",
          line: 7,
          column: 9,
        }),
      ).toThrow(/editor_not_allowed/);
    },
  );

  it.each([
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
    [0, 1],
    [1, 0],
  ])(
    "rejects invalid line %s or column %s before spawning",
    async (line, column) => {
      await expect(
        openInEditor("src/app.tsx", line, column, "vscode", ["src"]),
      ).resolves.toEqual({
        ok: false,
        reason: "invalid_location",
      });
    },
  );
});
