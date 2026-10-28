// Dev-only guard helpers. Production builds must strip all devtools code.

export function isDevEnvironment(
  env?: Record<string, string | undefined>,
): boolean {
  const e = env ?? (typeof process !== "undefined" ? process.env : {});
  if (e.NODE_ENV === "production") return false;
  if (e.NEXT_DEVTOOLS === "0") return false;
  if (e.NEXT_DEVTOOLS === "false") return false;
  return true;
}

export function devOnly<T>(fn: () => T): T | null {
  if (!isDevEnvironment()) return null;
  return fn();
}

// Marker for AST-based setup merge detection
export const SETUP_MARKER = "// @next-devtools/setup";
