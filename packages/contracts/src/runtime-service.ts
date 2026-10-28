export type RuntimeServiceStatus =
  "available" | "partial" | "unavailable" | "error";

export interface RuntimeServiceSnapshot<T> {
  readonly status: RuntimeServiceStatus;
  readonly data: T;
  readonly reason?: string;
  readonly revision: number;
}

export interface RuntimeService<T> {
  getSnapshot(): RuntimeServiceSnapshot<T>;
  subscribe(listener: () => void): () => void;
}

export const RUNTIME_SERVICE_IDS = {
  react: "next-devtools.runtime.react",
  routes: "next-devtools.runtime.routes",
  timeline: "next-devtools.runtime.timeline",
  network: "next-devtools.runtime.network",
  stores: "next-devtools.runtime.stores",
  editor: "next-devtools.runtime.editor",
  sessions: "next-devtools.runtime.sessions",
  diagnostics: "next-devtools.runtime.diagnostics",
} as const;

export type RuntimeServiceId =
  (typeof RUNTIME_SERVICE_IDS)[keyof typeof RUNTIME_SERVICE_IDS];

export function createUnavailableSnapshot(
  reason: string,
): RuntimeServiceSnapshot<undefined> & { readonly status: "unavailable" } {
  return {
    status: "unavailable",
    data: undefined,
    reason,
    revision: 0,
  };
}
