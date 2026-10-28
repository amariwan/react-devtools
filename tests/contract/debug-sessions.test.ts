import { describe, expect, it } from "vitest";
import {
  captureDebugSession,
  compareDebugSessions,
} from "../../packages/core/src/debug-sessions";

const timelineEvent = (id: string, timestampUnixMs: number) => ({
  id,
  layer: "navigation",
  type: "navigation",
  timestampUnixMs,
  payload: { url: "/dashboard" },
});

describe("debug sessions", () => {
  it("captures bounded sanitized evidence and profiler data", () => {
    const session = captureDebugSession({
      sessionId: "debug-a",
      capturedAtUnixMs: 10,
      timeline: [timelineEvent("1", 1), timelineEvent("2", 2)],
      network: [{ id: "n1" } as never],
      diagnostics: [{ id: "d1" } as never],
      limit: 1,
    });

    expect(session).toMatchObject({
      sessionId: "debug-a",
      capturedAtUnixMs: 10,
      timeline: [timelineEvent("2", 2)],
      network: [{ id: "n1" }],
      diagnostics: [{ id: "d1" }],
      profiler: { commits: [], ranked: [] },
    });
  });

  it("compares evidence counts and measured profiler changes", () => {
    const before = captureDebugSession({
      sessionId: "before",
      capturedAtUnixMs: 1,
      timeline: [timelineEvent("1", 1)],
    });
    const after = captureDebugSession({
      sessionId: "after",
      capturedAtUnixMs: 2,
      timeline: [timelineEvent("1", 1), timelineEvent("2", 2)],
      network: [{ id: "n1" } as never],
      diagnostics: [{ id: "d1" } as never],
    });

    expect(compareDebugSessions(before, after)).toMatchObject({
      timelineDelta: 1,
      networkDelta: 1,
      diagnosticsDelta: 1,
      profiler: { totalCommitDelta: 0 },
    });
  });
});
