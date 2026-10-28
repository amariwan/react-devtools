// Source location resolution and safe editor-open path validation.

import type { SourceLocation } from "@next-devtools/contracts";

export type SourceResolutionInput = {
  reactDebugSource?: { file: string; line: number; column: number } | null;
  compileAttribute?: { file: string; line: number; column: number } | null;
  staticIndex?: { file: string; line: number; column: number } | null;
};

// Priority: react-debug -> compile-attribute -> static-index -> unavailable
export function resolveSourceLocation(
  input: SourceResolutionInput,
): SourceLocation | null {
  if (input.reactDebugSource) {
    return {
      workspaceRelativePath: input.reactDebugSource.file,
      line: input.reactDebugSource.line,
      column: input.reactDebugSource.column,
      origin: "react-debug",
      confidence: "exact",
    };
  }
  if (input.compileAttribute) {
    return {
      workspaceRelativePath: input.compileAttribute.file,
      line: input.compileAttribute.line,
      column: input.compileAttribute.column,
      origin: "compile-attribute",
      confidence: "derived",
    };
  }
  if (input.staticIndex) {
    return {
      workspaceRelativePath: input.staticIndex.file,
      line: input.staticIndex.line,
      column: input.staticIndex.column,
      origin: "static-index",
      confidence: "approximate",
    };
  }
  return null;
}

// Validate a path for open-in-editor: must stay within workspace roots.
export type PathValidationResult =
  { ok: true; canonical: string } | { ok: false; reason: string };

export function validateEditorPath(
  requested: string,
  workspaceRoots: string[],
): PathValidationResult {
  // Reject traversal, absolute escapes, null bytes, uri schemes
  if (!requested || typeof requested !== "string")
    return { ok: false, reason: "empty" };
  if (requested.includes("\0")) return { ok: false, reason: "null_byte" };
  if (/^[a-z]+:/i.test(requested) && !/^[a-z]:/i.test(requested)) {
    return { ok: false, reason: "uri_scheme" };
  }
  // normalize separators
  const normalized = requested.replace(/\\/g, "/");
  const parts = normalized.split("/");
  if (parts.includes("..")) return { ok: false, reason: "traversal" };
  // If absolute, check it's within one of the (possibly relative) roots resolved against cwd
  const isAbs = normalized.startsWith("/") || /^[a-z]:/i.test(normalized);
  if (isAbs) {
    const underRoot = workspaceRoots.some((root) => {
      const r = root.replace(/\\/g, "/").replace(/\/$/, "");
      const rootIsAbsolute = r.startsWith("/") || /^[a-z]:/i.test(r);
      return (
        rootIsAbsolute && (normalized === r || normalized.startsWith(r + "/"))
      );
    });
    if (!underRoot) return { ok: false, reason: "outside_workspace" };
    return { ok: true, canonical: normalized };
  }
  // relative: must not contain ..
  // check against roots (prefix match)
  const allowed = workspaceRoots.some((root) => {
    const r = root.replace(/\\/g, "/").replace(/\/$/, "");
    return normalized === r || normalized.startsWith(r + "/");
  });
  if (!allowed) return { ok: false, reason: "outside_workspace" };
  return { ok: true, canonical: normalized };
}

export type EditorTarget = "vscode" | "cursor";

export type EditorCommand = (location: {
  file: string;
  line: number;
  column: number;
}) => { executable: string; args: string[] };

const editorCommands = new Map<string, EditorCommand>();

function buildVscodeCommand(location: {
  file: string;
  line: number;
  column: number;
}) {
  return {
    executable: "code",
    args: ["--goto", `${location.file}:${location.line}:${location.column}`],
  };
}

function buildCursorCommand(location: {
  file: string;
  line: number;
  column: number;
}) {
  return {
    executable: "cursor",
    args: ["--goto", `${location.file}:${location.line}:${location.column}`],
  };
}

registerEditorCommand("vscode", buildVscodeCommand);
registerEditorCommand("cursor", buildCursorCommand);

// Fixed allowlist of editor targets with command support. Additional editors
// can be registered by third parties without touching the runtime code.
export const REGISTERED_EDITORS: readonly EditorTarget[] = ["vscode", "cursor"];

export function registerEditorCommand(
  editor: string,
  build: EditorCommand,
): void {
  editorCommands.set(editor, build);
}

export function isEditorTarget(value: unknown): value is EditorTarget {
  return (
    typeof value === "string" &&
    (REGISTERED_EDITORS as readonly string[]).includes(value)
  );
}

export function buildEditorCommand(
  target: EditorTarget,
  location: { file: string; line: number; column: number },
): { executable: string; args: string[] } {
  const build = editorCommands.get(target);
  if (!build) {
    throw new Error(`editor_not_allowed:${target}`);
  }
  return build(location);
}
