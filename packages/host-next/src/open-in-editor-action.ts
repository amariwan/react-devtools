"use server";

import path from "node:path";
import { isDevEnvironment } from "./dev-guard.js";
import {
  isEditorTarget,
  type EditorTarget,
} from "@next-devtools/source-inspector";

export type OpenInEditorActionInput = {
  path?: unknown;
  line?: unknown;
  column?: unknown;
  editor?: unknown;
};

export type OpenInEditorActionResult =
  { ok: true } | { ok: false; reason: string };

export type OpenInEditorExecutor = (
  absPath: string,
  line: number,
  column: number,
  editor: EditorTarget,
  roots: string[],
) => Promise<{ ok: boolean; reason?: string }>;

export type ValidateRequestContext = () => Promise<boolean>;

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function validateRequestContextWithHeaders(): Promise<boolean> {
  try {
    const importer = new Function("m", "return import(m)") as (
      m: string,
    ) => Promise<{
      headers: () => Promise<{ get(name: string): string | null }>;
    }>;
    const mod = await importer("next/headers");
    const h = await mod.headers();
    const host = h.get("host");
    if (!host) {
      // Fail closed: a request without a host header cannot be verified.
      return false;
    }
    if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) {
      return false;
    }
    const origin = h.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== host) return false;
      } catch {
        return false;
      }
    }
  } catch {
    // Fail closed: unresolvable/invalid request context must never be allowed.
    return false;
  }
  return true;
}

export async function openInEditorWithAuthorization(
  input: OpenInEditorActionInput,
  executor?: OpenInEditorExecutor,
  options: { validateRequestContext?: ValidateRequestContext } = {},
): Promise<OpenInEditorActionResult> {
  if (!isDevEnvironment()) {
    return { ok: false, reason: "not_development" };
  }

  const validateRequestContext =
    options.validateRequestContext ?? validateRequestContextWithHeaders;
  if (!(await validateRequestContext())) {
    return { ok: false, reason: "unauthorized_origin" };
  }

  const rawPath = asString(input?.path);
  if (!rawPath) return { ok: false, reason: "invalid_path" };

  if (!isPositiveInteger(input?.line)) {
    return { ok: false, reason: "invalid_line" };
  }
  const line = input.line;

  const columnValue = input?.column === undefined ? 1 : input.column;
  if (!isPositiveInteger(columnValue)) {
    return { ok: false, reason: "invalid_column" };
  }
  const column = columnValue;

  const rawEditor = input?.editor === undefined ? "vscode" : input.editor;
  const editorString = asString(rawEditor);
  if (!editorString || !isEditorTarget(editorString)) {
    return { ok: false, reason: "editor_not_allowed" };
  }
  const editor = editorString;

  const cwd = process.cwd();
  const absPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(cwd, rawPath);

  // Filesystem roots are trusted server configuration. Never accept them from
  // browser-controlled action input.
  const roots = [
    path.join(cwd, "src"),
    path.join(cwd, "app"),
    path.join(cwd, "pages"),
  ];

  const exec = executor ?? (await import("./editor-bridge.js")).openInEditor;
  const result = await exec(absPath, line, column, editor, roots);
  return result.ok
    ? { ok: true }
    : { ok: false, reason: result.reason ?? "open_failed" };
}

export async function openInEditorAction(
  input: OpenInEditorActionInput,
): Promise<OpenInEditorActionResult> {
  return openInEditorWithAuthorization(input);
}
