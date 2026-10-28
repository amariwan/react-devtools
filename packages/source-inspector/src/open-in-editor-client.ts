// Client-side helper to request open-in-editor from the host.

import type { EditorTarget } from "./source-resolver.js";

export type EditorLocation = { path: string; line: number; column: number };
export type OpenEditorClientResult =
  { ok: true } | { ok: false; reason: string };

export function isValidEditorLocation(location: EditorLocation): boolean {
  return (
    Boolean(location.path) &&
    Number.isFinite(location.line) &&
    Number.isFinite(location.column) &&
    location.line >= 1 &&
    location.column >= 1
  );
}

export async function requestOpenInEditor(
  endpoint: string,
  location: EditorLocation,
  editor: EditorTarget = "vscode",
): Promise<OpenEditorClientResult> {
  if (!isValidEditorLocation(location))
    return { ok: false, reason: "invalid_location" };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location.path,
        line: location.line,
        column: location.column,
        editor,
      }),
    });
    const result = (await res.json()) as OpenEditorClientResult;
    return result.ok ? { ok: true } : { ok: false, reason: result.reason };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}
