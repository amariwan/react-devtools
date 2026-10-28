import path from "node:path";
import { isDevEnvironment } from "@next-devtools/host-next";
import { openInEditor } from "@next-devtools/host-next/editor";
import {
  isEditorTarget,
  type EditorTarget,
} from "@next-devtools/source-inspector";

export interface OpenInEditorHandlerOptions {
  roots?: string[];
  editor?: EditorTarget;
}

type JsonBody = {
  path?: unknown;
  line?: unknown;
  column?: unknown;
  editor?: unknown;
};

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function validateOriginAndHost(req: Request): boolean {
  const host = req.headers.get("host");
  if (!host) return false;
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) return false;
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export async function handleOpenInEditorRequest(
  req: Request,
  options: OpenInEditorHandlerOptions = {},
): Promise<Response> {
  if (!isDevEnvironment()) {
    return jsonResponse({ ok: false, reason: "not_development" }, 404);
  }

  if (!validateOriginAndHost(req)) {
    return jsonResponse({ ok: false, reason: "unauthorized_origin" }, 403);
  }

  let body: JsonBody;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return jsonResponse({ ok: false, reason: "invalid_json" }, 400);
    }
    body = parsed as JsonBody;
  } catch {
    return jsonResponse({ ok: false, reason: "invalid_json" }, 400);
  }

  if (typeof body.path !== "string" || body.path.length === 0) {
    return jsonResponse({ ok: false, reason: "invalid_path" }, 400);
  }
  const requestedPath = body.path;

  if (!isPositiveInteger(body.line)) {
    return jsonResponse({ ok: false, reason: "invalid_line" }, 400);
  }
  const line = body.line;

  if (!isPositiveInteger(body.column ?? 1)) {
    return jsonResponse({ ok: false, reason: "invalid_column" }, 400);
  }
  const column = (body.column ?? 1) as number;

  const editorCandidate =
    body.editor === undefined ? (options.editor ?? "vscode") : body.editor;
  if (!isEditorTarget(editorCandidate)) {
    return jsonResponse({ ok: false, reason: "editor_not_allowed" }, 400);
  }
  const editor = editorCandidate;

  const cwd = process.cwd();
  const absPath = path.isAbsolute(requestedPath)
    ? requestedPath
    : path.resolve(cwd, requestedPath);

  // Roots come from trusted server configuration only. Request JSON is
  // browser-controlled and must not be able to expand the filesystem scope.
  const roots = options.roots ?? [
    path.join(cwd, "src"),
    path.join(cwd, "app"),
    path.join(cwd, "pages"),
  ];

  const result = await openInEditor(absPath, line, column, editor, roots);
  return jsonResponse(
    result.ok ? { ok: true } : { ok: false, reason: result.reason },
    result.ok ? 200 : 400,
  );
}

export function createOpenInEditorHandler(
  options: OpenInEditorHandlerOptions = {},
): (req: Request) => Promise<Response> {
  return (req: Request) => handleOpenInEditorRequest(req, options);
}

export const POST = createOpenInEditorHandler();
export const openInEditorRoute = POST;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
