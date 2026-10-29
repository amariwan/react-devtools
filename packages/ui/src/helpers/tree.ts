/**
 * Pure tree helpers for the TreeView primitive: flattening by expansion
 * state, expansion toggling, and match-preserving filtering.
 */

export interface TreeNode {
  id: string;
  children?: TreeNode[] | null;
}

export interface FlatRow<T extends TreeNode> {
  node: T;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  /** Position in the flattened, visible row list. */
  index: number;
}

export function flattenTree<T extends TreeNode>(
  nodes: readonly T[],
  expanded: ReadonlySet<string> = new Set(),
  maxDepth = Infinity,
): FlatRow<T>[] {
  const rows: FlatRow<T>[] = [];
  const visit = (list: readonly T[], depth: number): void => {
    if (depth > maxDepth) return;
    for (const node of list) {
      const children = node.children ?? null;
      const hasChildren = children !== null && children.length > 0;
      const isExpanded = hasChildren && expanded.has(node.id);
      rows.push({
        node,
        depth,
        hasChildren,
        expanded: isExpanded,
        index: rows.length,
      });
      if (isExpanded && children) {
        visit(children as unknown as readonly T[], depth + 1);
      }
    }
  };
  visit(nodes, 0);
  return rows;
}

export function toggleExpanded(
  expanded: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(expanded);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Keeps a node when it (or any descendant) matches, pruning non-matching
 * leaves while preserving the surviving branch structure.
 */
export function filterTree<T extends TreeNode>(
  nodes: readonly T[],
  matches: (node: T) => boolean,
): T[] {
  const result: T[] = [];
  for (const node of nodes) {
    const children = node.children
      ? filterTree(node.children as unknown as readonly T[], matches)
      : null;
    const selfMatches = matches(node);
    const hasMatchingChildren = children !== null && children.length > 0;
    if (!selfMatches && !hasMatchingChildren) continue;

    if (children === null) {
      result.push(node);
    } else {
      result.push({ ...node, children } as T);
    }
  }
  return result;
}
