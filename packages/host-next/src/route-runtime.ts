import type {
  RuntimeService,
  RuntimeServiceSnapshot,
} from "@next-devtools/contracts";
import type { RouteSegment, RouteTree } from "./route-scanner.js";

export interface RouteRuntimeSnapshot {
  readonly tree: RouteTree;
  readonly pathname: string;
  readonly activeSegmentIds: readonly string[];
  readonly params: Readonly<Record<string, string | readonly string[]>>;
  readonly searchParams: Readonly<Record<string, readonly string[]>>;
}

export interface RouteRuntimeService extends RuntimeService<RouteRuntimeSnapshot> {
  setTree(tree: RouteTree): void;
  setLocation(url: string): void;
}

type Match = {
  ids: string[];
  params: Record<string, string | string[]>;
  score: number;
};

function chainFor(
  node: RouteSegment,
  nodes: readonly RouteSegment[],
): RouteSegment[] {
  const chain: RouteSegment[] = [];
  let current: RouteSegment | undefined = node;
  while (current && current.id !== "__root__") {
    chain.unshift(current);
    current = nodes.find((candidate) => candidate.id === current?.parentId);
  }
  return chain;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function matchNode(
  node: RouteSegment,
  tree: RouteTree,
  pathname: string,
): Match | undefined {
  const pathParts = pathname.split("/").filter(Boolean).map(safeDecode);
  const chain = chainFor(node, tree.nodes);
  const routeSegments = chain.filter((segment) => segment.urlSegment !== "");
  const params: Record<string, string | string[]> = {};
  let pathIndex = 0;
  let score = 0;

  for (const segment of routeSegments) {
    if (segment.kind === "catch-all" || segment.kind === "optional-catch-all") {
      const rest = pathParts.slice(pathIndex);
      if (segment.kind === "catch-all" && rest.length === 0) return undefined;
      const name = segment.dynamicParamNames[0];
      if (name) params[name] = rest;
      pathIndex = pathParts.length;
      score += segment.kind === "catch-all" ? 1 : 0;
      continue;
    }

    const value = pathParts[pathIndex];
    if (value === undefined) return undefined;
    const dynamicName = segment.dynamicParamNames[0];
    if (segment.kind === "dynamic" || dynamicName) {
      if (dynamicName) params[dynamicName] = value;
      score += 2;
    } else if (segment.urlSegment === value) {
      score += 4;
    } else {
      return undefined;
    }
    pathIndex++;
  }

  if (pathIndex !== pathParts.length) return undefined;
  return {
    ids: [tree.rootId, ...chain.map(({ id }) => id)],
    params,
    score: score + chain.length,
  };
}

function activeMatch(tree: RouteTree, pathname: string): Match {
  const candidates = tree.nodes
    .filter(
      (node) =>
        node.fileRoles.includes("page") || node.fileRoles.includes("route"),
    )
    .map((node) => matchNode(node, tree, pathname))
    .filter((match): match is Match => match !== undefined)
    .sort(
      (left, right) =>
        right.score - left.score || right.ids.length - left.ids.length,
    );
  return candidates[0] ?? { ids: [], params: {}, score: 0 };
}

function parseLocation(url: string) {
  const parsed = new URL(url, "http://next-devtools.local");
  const searchParams: Record<string, string[]> = {};
  for (const [key, value] of parsed.searchParams) {
    (searchParams[key] ??= []).push(value);
  }
  return { pathname: parsed.pathname, searchParams };
}

export function createRouteRuntimeService(initial: {
  tree: RouteTree;
  url?: string;
}): RouteRuntimeService {
  const listeners = new Set<() => void>();
  let tree = initial.tree;
  let location = parseLocation(initial.url ?? "/");
  let revision = 0;
  let snapshot: RuntimeServiceSnapshot<RouteRuntimeSnapshot> = buildSnapshot();

  function buildSnapshot(): RuntimeServiceSnapshot<RouteRuntimeSnapshot> {
    const match = activeMatch(tree, location.pathname);
    return {
      status: "available",
      data: {
        tree,
        pathname: location.pathname,
        activeSegmentIds: match.ids,
        params: match.params,
        searchParams: location.searchParams,
      },
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTree(nextTree) {
      tree = nextTree;
      notify();
    },
    setLocation(url) {
      location = parseLocation(url);
      notify();
    },
  };
}
