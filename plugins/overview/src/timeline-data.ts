import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { TimelineRuntimeSnapshot } from "@next-devtools/core";

export type TimelinePanelData = {
  status: string;
  reason?: string;
  recording: boolean;
  count: number;
  dropped: number;
  events: TimelineRuntimeSnapshot["events"];
};

export function buildTimelineData(
  snapshot: RuntimeServiceSnapshot<TimelineRuntimeSnapshot> | null,
): TimelinePanelData {
  return {
    status: snapshot?.status ?? "unavailable",
    ...(snapshot?.reason ? { reason: snapshot.reason } : {}),
    recording: snapshot?.data.recording ?? false,
    count: snapshot?.data.events.length ?? 0,
    dropped: snapshot?.data.dropped ?? 0,
    events: snapshot?.data.events ?? [],
  };
}
