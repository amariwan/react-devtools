// React introspection bridge types and helpers.
// Primary: reuse React DevTools backend path (pinned version tests).
// This module must not import React DevTools internals directly; adapter isolates them.

export type ReactBridgeCapability = {
  tree: boolean;
  props: boolean;
  hooks: boolean;
  source: boolean;
  profiler: boolean;
  selection: boolean;
};

export type ComponentKind =
  | "function"
  | "class"
  | "host"
  | "suspense"
  | "fragment"
  | "portal"
  | "memo"
  | "forwardRef"
  | "root"
  | "context"
  | "profiler"
  | "lazy"
  | "offscreen";

export type ComponentNode = {
  id: string;
  displayName: string;
  kind: ComponentKind;
  parentId: string | null;
  childIds: string[];
  source?: { file: string; line: number; column: number };
  hasState: boolean;
};

export type ComponentDetail = {
  id: string;
  props: Record<string, unknown>;
  hooks: Array<{ name: string; value: unknown }>;
  state: unknown;
  context: Array<{ name: string; value: unknown }>;
};

export type ReactCommitEvent = {
  readonly rendererId: number;
  readonly rootId?: string;
  readonly priority?: number;
};

export type SuspenseBoundaryStatus =
  "resolved" | "suspended" | "dehydrated" | "unknown";

export type SuspenseBoundary = {
  readonly id: string;
  readonly displayName: string;
  readonly status: SuspenseBoundaryStatus;
};

export interface ReactBridge {
  isAvailable(): boolean;
  getCapabilities(): ReactBridgeCapability;
  getRoots(): string[];
  getTree(rootId: string): ComponentNode[];
  getDetail(id: string): ComponentDetail | undefined;
  getSource(
    id: string,
  ): { file: string; line: number; column: number } | undefined;
  // selection: highlight DOM node
  selectByDomNode(node: unknown): string | undefined;
  // profiling
  startProfiling(): void;
  stopProfiling(): { commits: number };
}

type MaybePromise<T> = T | Promise<T>;

export interface ReactBridgeAdapter {
  isAvailable(): boolean;
  getCapabilities(): ReactBridgeCapability;
  getRoots(): MaybePromise<string[]>;
  getTree(rootId: string): MaybePromise<ComponentNode[]>;
  getDetail(id: string): MaybePromise<ComponentDetail | undefined>;
  getSource(
    id: string,
  ): MaybePromise<{ file: string; line: number; column: number } | undefined>;
  selectByDomNode(node: unknown): MaybePromise<string | undefined>;
  getSuspenseBoundaries?(rootId: string): MaybePromise<SuspenseBoundary[]>;
  subscribe?(listener: () => void): () => void;
  subscribeToCommits?(listener: (event: ReactCommitEvent) => void): () => void;
  dispose?(): void;
}

export const REACT_DEVTOOLS_BASELINE = {
  reactCommit: "fd51cb10dd154aee73e4e7948005c02968651c3d",
  reactDevtoolsInlineVersion: "8.0.0",
} as const;

// Early hook installation helper. Must run before React loads.
// In Next, place in instrumentation-client.ts.
export const REACT_DEVTOOLS_GLOBAL_HOOK_KEY = "__REACT_DEVTOOLS_GLOBAL_HOOK__";

export function installReactDevtoolsHookEarly(): boolean {
  if (typeof globalThis === "undefined") return false;
  const g = globalThis as Record<string, unknown>;
  return Boolean(g[REACT_DEVTOOLS_GLOBAL_HOOK_KEY]);
}

export function detectReactDevtoolsExtension(): boolean {
  if (typeof globalThis === "undefined") return false;
  const g = globalThis as Record<string, unknown>;
  const hook = g[REACT_DEVTOOLS_GLOBAL_HOOK_KEY] as
    { _extension?: boolean } | undefined;
  return Boolean(hook && hook._extension);
}
