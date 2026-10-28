import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { NetworkRuntimeSnapshot, NetworkEntry } from "@next-devtools/core";

export interface NetworkData {
  readonly status: "available" | "partial" | "unavailable" | "error";
  readonly reason?: string;
  readonly recording: boolean;
  readonly dropped: number;
  readonly entries: readonly NetworkEntry[];
  readonly count: number;
}

export function buildNetworkData(
  snapshot: RuntimeServiceSnapshot<NetworkRuntimeSnapshot> | null | undefined,
): NetworkData {
  if (!snapshot) {
    return {
      status: "unavailable",
      reason: "Network runtime unavailable",
      recording: false,
      dropped: 0,
      entries: [],
      count: 0,
    };
  }
  const data = snapshot.data;
  return {
    status: snapshot.status,
    ...(snapshot.reason ? { reason: snapshot.reason } : {}),
    recording: data?.recording ?? false,
    dropped: data?.dropped ?? 0,
    entries: data?.entries ?? [],
    count: data?.entries?.length ?? 0,
  };
}
