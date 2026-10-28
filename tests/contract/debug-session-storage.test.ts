import { describe, expect, it } from "vitest";
import {
  DEBUG_SESSION_STORAGE_KEY,
  SHARED_DEBUG_SESSION_STORAGE_KEY,
  loadDebugSessions,
  saveDebugSessions,
} from "../../plugins/overview/src/debug-session-storage";
import { captureDebugSession } from "../../packages/core/src/debug-sessions";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  } as Storage;
}

function session(id: string) {
  return captureDebugSession({
    sessionId: id,
    capturedAtUnixMs: 1,
    timeline: [],
    network: [],
    diagnostics: [],
  });
}

describe("debug session storage", () => {
  it("round-trips only the bounded tail and ignores malformed data", () => {
    const target = storage();
    saveDebugSessions(target, [session("a"), session("b"), session("c")]);
    expect(loadDebugSessions(target).map(({ sessionId }) => sessionId)).toEqual(
      ["b", "c"],
    );

    target.setItem(DEBUG_SESSION_STORAGE_KEY, JSON.stringify([{ bad: true }]));
    expect(loadDebugSessions(target)).toEqual([]);
  });

  it("does not persist an oversized payload", () => {
    const target = storage();
    const oversized = captureDebugSession({
      sessionId: "large",
      capturedAtUnixMs: 1,
      timeline: [
        {
          id: "event",
          layer: "custom",
          type: "payload",
          timestampUnixMs: 1,
          payload: "x".repeat(350_000),
        },
      ],
    });
    saveDebugSessions(target, [oversized]);
    expect(target.getItem(DEBUG_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("supports a separate bounded store for explicit cross-tab sharing", () => {
    const target = storage();
    saveDebugSessions(
      target,
      [session("shared")],
      SHARED_DEBUG_SESSION_STORAGE_KEY,
    );

    expect(
      loadDebugSessions(target, SHARED_DEBUG_SESSION_STORAGE_KEY).map(
        ({ sessionId }) => sessionId,
      ),
    ).toEqual(["shared"]);
    expect(target.getItem(SHARED_DEBUG_SESSION_STORAGE_KEY)).toContain(
      "shared",
    );
  });
});
