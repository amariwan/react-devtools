export type DevtoolsEnvelope<T> = {
  protocolVersion: 1;
  sessionId: string;
  pageId?: string;
  requestId?: string;
  sequence: number;
  timestampUnixMs: number;
  monotonicMs?: number;
  event: string; // namespaced "react:component:updated"
  payload: T;
};
