// Editor bridge: validated open-in-editor. Server-side only (Node).

import { spawn } from "node:child_process";
import { realpath } from "node:fs/promises";
import { isAbsolute, relative } from "node:path";
import {
  validateEditorPath,
  buildEditorCommand,
} from "@next-devtools/source-inspector";
import type { EditorTarget } from "@next-devtools/source-inspector";

export type OpenEditorResult = { ok: true } | { ok: false; reason: string };

export type EditorSpawn = (
  executable: string,
  args: string[],
  events: { spawn(): void; error(error: Error): void },
) => void;

const defaultEditorSpawn: EditorSpawn = (executable, args, events) => {
  const child = spawn(executable, args, { detached: true, stdio: "ignore" });
  child.once("error", events.error);
  child.once("spawn", () => {
    child.unref();
    events.spawn();
  });
};

export function spawnEditorAndWait(
  executable: string,
  args: string[],
  spawnEditor: EditorSpawn = defaultEditorSpawn,
): Promise<OpenEditorResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: OpenEditorResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    try {
      spawnEditor(executable, args, {
        spawn: () => finish({ ok: true }),
        error: (error) => finish({ ok: false, reason: error.message }),
      });
    } catch (error) {
      finish({
        ok: false,
        reason: error instanceof Error ? error.message : "spawn_failed",
      });
    }
  });
}

export async function validateCanonicalEditorPath(
  requestedPath: string,
  workspaceRoots: string[],
): Promise<{ ok: true; canonical: string } | { ok: false; reason: string }> {
  try {
    const canonical = await realpath(requestedPath);
    const canonicalRoots = (
      await Promise.all(
        workspaceRoots.map(async (root) => {
          try {
            return await realpath(root);
          } catch {
            return null;
          }
        }),
      )
    ).filter((root): root is string => root !== null);
    // If no trusted root could be resolved, fail closed.
    if (canonicalRoots.length === 0) {
      return { ok: false, reason: "path_unavailable" };
    }
    const allowed = canonicalRoots.some((root) => {
      const pathFromRoot = relative(root, canonical);
      return (
        pathFromRoot === "" ||
        (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot))
      );
    });
    return allowed
      ? { ok: true, canonical }
      : { ok: false, reason: "outside_workspace" };
  } catch {
    return { ok: false, reason: "path_unavailable" };
  }
}

export async function openInEditor(
  requestedPath: string,
  line: number,
  column: number,
  editor: EditorTarget,
  workspaceRoots: string[],
  options?: {
    spawn?: EditorSpawn;
    canonicalize?: typeof validateCanonicalEditorPath;
  },
): Promise<OpenEditorResult> {
  if (
    !Number.isFinite(line) ||
    !Number.isFinite(column) ||
    line < 1 ||
    column < 1
  ) {
    return { ok: false, reason: "invalid_location" };
  }
  const validation = validateEditorPath(requestedPath, workspaceRoots);
  if (!validation.ok) return { ok: false, reason: validation.reason };
  const canonicalValidation = await (
    options?.canonicalize ?? validateCanonicalEditorPath
  )(validation.canonical, workspaceRoots);
  if (!canonicalValidation.ok) return canonicalValidation;
  const { executable, args } = buildEditorCommand(editor, {
    file: canonicalValidation.canonical,
    line,
    column,
  });
  return spawnEditorAndWait(executable, args, options?.spawn);
}
