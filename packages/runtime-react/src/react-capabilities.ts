import type {
  Capability,
  RuntimeServiceSnapshot,
  RuntimeServiceStatus,
} from "@next-devtools/contracts";
import type { ReactRuntimeSnapshot } from "./react-runtime.js";

/**
 * Capabilities the React bridge can satisfy, derived from its current snapshot.
 *
 * The bridge is considered `available` only when the runtime service itself is
 * available. Every other state (unavailable, partial, error) still publishes the
 * capabilities as `partial` so the UI can render disabled panels with a reason
 * instead of hiding them entirely.
 */
export function reactCapabilityDescriptors(
  snapshot: Pick<
    RuntimeServiceSnapshot<ReactRuntimeSnapshot>,
    "status" | "reason"
  > & {
    data?: Pick<ReactRuntimeSnapshot, "capabilities">;
  },
): Capability[] {
  const status: RuntimeServiceStatus = snapshot.status;
  const availability = status === "available" ? "available" : "partial";
  const reason = availability === "available" ? undefined : snapshot.reason;

  const descriptors: Capability[] = [
    {
      id: "react.component.inspect",
      availability,
      source: "react",
      permission: "read",
      ...(reason ? { reason } : {}),
    },
    {
      id: "react.component.source",
      availability,
      source: "react",
      permission: "read",
      ...(reason ? { reason } : {}),
    },
  ];

  if (snapshot.data?.capabilities.profiler) {
    descriptors.push({
      id: "react.profiler.commit-signal",
      availability,
      source: "react",
      permission: "read",
      ...(reason ? { reason } : {}),
    });
  }

  return descriptors;
}
