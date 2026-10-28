import type { RuntimeServiceSnapshot } from "@next-devtools/contracts";
import type { ReactRuntimeSnapshot } from "@next-devtools/runtime-react";
import type { ComponentNode } from "@next-devtools/runtime-react";

export interface GraphNode {
  readonly id: string;
  readonly displayName: string;
  readonly kind: string;
  readonly hasState: boolean;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
}

export interface GraphData {
  readonly status: "available" | "partial" | "unavailable" | "error";
  readonly reason?: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

export function buildGraphData(
  snapshot: RuntimeServiceSnapshot<ReactRuntimeSnapshot> | null | undefined,
): GraphData {
  if (!snapshot) {
    return {
      status: "unavailable",
      reason: "React runtime unavailable",
      nodeCount: 0,
      edgeCount: 0,
      nodes: [],
      edges: [],
    };
  }
  const tree = (snapshot.data?.tree ?? []) as readonly ComponentNode[];
  const nodes: GraphNode[] = tree.map((n) => ({
    id: n.id,
    displayName: n.displayName,
    kind: n.kind,
    hasState: n.hasState,
  }));
  const edges: GraphEdge[] = [];
  for (const n of tree) {
    if (n.parentId) edges.push({ from: n.parentId, to: n.id });
  }
  return {
    status: snapshot.status,
    ...(snapshot.reason ? { reason: snapshot.reason } : {}),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
  };
}
