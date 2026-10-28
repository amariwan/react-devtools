import type { RuntimeDiagnostic } from "./diagnostics-runtime.js";
import type { NetworkEntry } from "./network-runtime.js";
import {
  buildProfilerInsights,
  compareProfilerInsights,
  type ProfilerComparison,
  type ProfilerInsights,
} from "./profiler-insights.js";
import type { TimelineEvent } from "./timeline-store.js";

export type DebugSession = {
  readonly sessionId: string;
  readonly capturedAtUnixMs: number;
  readonly timeline: readonly TimelineEvent[];
  readonly network: readonly NetworkEntry[];
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly profiler: ProfilerInsights;
};

export type DebugSessionComparison = {
  readonly timelineDelta: number;
  readonly networkDelta: number;
  readonly diagnosticsDelta: number;
  readonly profiler: ProfilerComparison;
};

function boundedLimit(value: number | undefined): number {
  return Math.max(1, Math.min(500, Math.floor(value ?? 200)));
}

export function captureDebugSession(input: {
  sessionId: string;
  capturedAtUnixMs: number;
  timeline?: readonly TimelineEvent[];
  network?: readonly NetworkEntry[];
  diagnostics?: readonly RuntimeDiagnostic[];
  limit?: number;
}): DebugSession {
  const limit = boundedLimit(input.limit);
  const timeline = [...(input.timeline ?? []).slice(-limit)];
  return {
    sessionId: input.sessionId,
    capturedAtUnixMs: input.capturedAtUnixMs,
    timeline,
    network: [...(input.network ?? []).slice(-limit)],
    diagnostics: [...(input.diagnostics ?? []).slice(-limit)],
    profiler: buildProfilerInsights(timeline),
  };
}

export function compareDebugSessions(
  before: DebugSession,
  after: DebugSession,
): DebugSessionComparison {
  return {
    timelineDelta: after.timeline.length - before.timeline.length,
    networkDelta: after.network.length - before.network.length,
    diagnosticsDelta: after.diagnostics.length - before.diagnostics.length,
    profiler: compareProfilerInsights(before.profiler, after.profiler),
  };
}
