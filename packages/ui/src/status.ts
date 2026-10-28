import type { StatusTone } from "./tokens.js";

export type { StatusTone } from "./tokens.js";

/** Status tones in display order. */
export const STATUS_TONES = [
  "available",
  "partial",
  "requires-instrumentation",
  "experimental",
  "unavailable",
  "error",
  "diagnostic",
] as const;

/**
 * Normalize a runtime status or capability availability string into a
 * semantic status tone. Unknown values collapse to `unavailable` so the UI
 * never fabricates a healthy-looking state.
 */
export function statusTone(value: string): StatusTone {
  switch (value) {
    case "available":
      return "available";
    case "partial":
      return "partial";
    case "requires-instrumentation":
      return "requires-instrumentation";
    case "experimental":
      return "experimental";
    case "unavailable":
      return "unavailable";
    case "error":
      return "error";
    case "diagnostic":
      return "diagnostic";
    default:
      return "unavailable";
  }
}

export const STATUS_LABELS: Record<StatusTone, string> = {
  available: "Available",
  partial: "Partial",
  "requires-instrumentation": "Requires instrumentation",
  experimental: "Experimental",
  unavailable: "Unavailable",
  error: "Error",
  diagnostic: "Diagnostic",
};
