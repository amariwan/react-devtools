// Session/page identifiers. Regenerated on reload (not positions).
export type SessionId = string & { readonly __brand: "SessionId" };
export type PageId = string & { readonly __brand: "PageId" };

export function newSessionId(): SessionId {
  return `ses_${crypto.randomUUID()}` as SessionId;
}

export function newPageId(): PageId {
  return `page_${crypto.randomUUID()}` as PageId;
}

export function isSessionId(value: unknown): value is SessionId {
  return typeof value === "string" && value.startsWith("ses_");
}
