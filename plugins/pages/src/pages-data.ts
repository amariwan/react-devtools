import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { RouteRuntimeSnapshot } from "@next-devtools/host-next/route-runtime";
import { buildUrlPattern } from "@next-devtools/host-next/route-scanner";

export interface PageRow {
  readonly id: string;
  readonly urlPattern: string;
  readonly fileRoles: readonly string[];
  readonly dynamicParamNames: readonly string[];
  readonly optionalParamNames: readonly string[];
  readonly execution?: "server" | "client" | "unknown";
}

function dynamicParamsFor(
  node: {
    parentId: string | null;
    dynamicParamNames: string[];
    kind: string;
  },
  nodes: readonly {
    id: string;
    parentId: string | null;
    dynamicParamNames: string[];
    kind: string;
  }[],
): { names: string[]; optionalNames: string[] } {
  const names: string[] = [];
  const optionalNames: string[] = [];
  let current: typeof node | undefined = node;
  while (current) {
    names.push(...current.dynamicParamNames);
    if (current.kind === "optional-catch-all") {
      optionalNames.push(...current.dynamicParamNames);
    }
    current = current.parentId
      ? nodes.find((candidate) => candidate.id === current?.parentId)
      : undefined;
  }
  return {
    names: [...new Set(names)].reverse(),
    optionalNames: [...new Set(optionalNames)].reverse(),
  };
}

export interface PagesData {
  readonly status: "available" | "unavailable" | "error" | "partial";
  readonly reason?: string;
  readonly segmentCount: number;
  readonly pageCount: number;
  readonly activePathname: string;
  readonly pages: readonly PageRow[];
}

export function buildPagesData(
  snapshot: RuntimeServiceSnapshot<RouteRuntimeSnapshot> | null | undefined,
): PagesData {
  if (!snapshot) {
    return {
      status: "unavailable",
      reason: "Route runtime unavailable",
      segmentCount: 0,
      pageCount: 0,
      activePathname: "/",
      pages: [],
    };
  }
  const data = snapshot.data;
  const nodes = data?.tree?.nodes ?? [];
  const pages = nodes
    .filter(
      (n) => n.fileRoles.includes("page") || n.fileRoles.includes("route"),
    )
    .map((n) => ({
      id: n.id,
      urlPattern: buildUrlPattern(n, nodes),
      fileRoles: [...n.fileRoles],
      ...(() => {
        const params = dynamicParamsFor(n, nodes);
        return {
          dynamicParamNames: params.names,
          optionalParamNames: params.optionalNames,
        };
      })(),
      ...(n.execution ? { execution: n.execution } : {}),
    }));
  return {
    status: snapshot.status,
    ...(snapshot.reason ? { reason: snapshot.reason } : {}),
    segmentCount: nodes.length,
    pageCount: pages.length,
    activePathname: data?.pathname ?? "/",
    pages,
  };
}
