// Availability states for capabilities and features.
// See blueprint section 3.3 and "Was 1:1 bedeutet".
export type Availability =
  | "available"
  | "partial"
  | "requires-instrumentation"
  | "unavailable"
  | "experimental";

export const AVAILABILITY_VALUES: readonly Availability[] = [
  "available",
  "partial",
  "requires-instrumentation",
  "unavailable",
  "experimental",
] as const;

export function isAvailability(value: unknown): value is Availability {
  return (
    typeof value === "string" &&
    (AVAILABILITY_VALUES as readonly string[]).includes(value)
  );
}
