export type DiagnosticError = {
  code: string; // e.g. "SOURCE_PATH_OUTSIDE_WORKSPACE"
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>; // already redacted
};
