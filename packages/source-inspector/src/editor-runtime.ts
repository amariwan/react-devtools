import type {
  RuntimeService,
  RuntimeServiceSnapshot,
  RuntimeServiceStatus,
} from "@next-devtools/contracts";
import type { EditorTarget } from "./source-resolver.js";
import {
  isValidEditorLocation,
  requestOpenInEditor,
  type EditorLocation,
  type OpenEditorClientResult,
} from "./open-in-editor-client.js";

export type EditorRequest = (
  endpoint: string,
  location: EditorLocation,
  editor: EditorTarget,
) => Promise<OpenEditorClientResult>;

export interface EditorRuntimeSnapshot {
  readonly editor: EditorTarget;
  readonly inFlight: boolean;
  readonly lastResult?: OpenEditorClientResult;
}

export interface EditorRuntimeService extends RuntimeService<EditorRuntimeSnapshot> {
  setEditor(editor: EditorTarget): void;
  open(location: EditorLocation): Promise<OpenEditorClientResult>;
}

export function createEditorRuntimeService(options: {
  endpoint: string;
  editor?: EditorTarget;
  request?: EditorRequest;
}): EditorRuntimeService {
  const request = options.request ?? requestOpenInEditor;
  const listeners = new Set<() => void>();
  let editor = options.editor ?? "vscode";
  let pendingRequests = 0;
  let latestRequest = 0;
  let lastResult: OpenEditorClientResult | undefined;
  let status: RuntimeServiceStatus = "available";
  let reason: string | undefined;
  let revision = 0;
  let snapshot: RuntimeServiceSnapshot<EditorRuntimeSnapshot> = buildSnapshot();

  function buildSnapshot(): RuntimeServiceSnapshot<EditorRuntimeSnapshot> {
    return {
      status,
      data: {
        editor,
        inFlight: pendingRequests > 0,
        ...(lastResult ? { lastResult } : {}),
      },
      ...(reason ? { reason } : {}),
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setEditor(nextEditor) {
      if (editor === nextEditor) return;
      editor = nextEditor;
      notify();
    },
    async open(location) {
      if (!isValidEditorLocation(location)) {
        const result = { ok: false, reason: "invalid_location" } as const;
        status = "error";
        reason = result.reason;
        lastResult = result;
        notify();
        return result;
      }

      const requestId = ++latestRequest;
      pendingRequests++;
      notify();
      let result: OpenEditorClientResult;
      try {
        result = await request(options.endpoint, location, editor);
      } catch (error) {
        result = {
          ok: false,
          reason: error instanceof Error ? error.message : String(error),
        };
      }
      pendingRequests--;
      if (requestId === latestRequest) {
        lastResult = result;
        status = result.ok ? "available" : "error";
        reason = result.ok ? undefined : result.reason;
      }
      notify();
      return result;
    },
  };
}
