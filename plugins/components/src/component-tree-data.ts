// Pure helpers behind the Components panel. Kept free of React and DOM access so
// tree shaping, search, and value formatting can be contract-tested in Node.

import type { ComponentNode } from "@next-devtools/runtime-react";
import { fuzzyScore } from "@next-devtools/ui";

export type ComponentTreeRow = {
  node: ComponentNode;
  depth: number;
};

/**
 * Flattens a component tree into display rows using the parent/child links the
 * adapter recorded. Children keep their sibling order; nodes whose parent is
 * not present in the snapshot are promoted to roots instead of being dropped.
 * Cycles and duplicate ids are visited once.
 */
export function flattenComponentTree(
  nodes: readonly ComponentNode[],
): ComponentTreeRow[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rows: ComponentTreeRow[] = [];
  const visited = new Set<string>();

  const rootIds: string[] = [];
  for (const node of nodes) {
    if (!node.parentId || !byId.has(node.parentId)) rootIds.push(node.id);
  }
  for (const node of nodes) {
    if (!visited.has(node.id) && !rootIds.includes(node.id))
      rootIds.push(node.id);
  }

  const stack: Array<{ id: string; depth: number }> = [];
  for (let index = rootIds.length - 1; index >= 0; index--) {
    stack.push({ id: rootIds[index]!, depth: 0 });
  }

  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (visited.has(frame.id)) continue;
    const node = byId.get(frame.id);
    if (!node) continue;
    visited.add(frame.id);
    rows.push({ node, depth: frame.depth });
    for (let index = node.childIds.length - 1; index >= 0; index--) {
      const childId = node.childIds[index]!;
      if (!visited.has(childId) && byId.has(childId)) {
        stack.push({ id: childId, depth: frame.depth + 1 });
      }
    }
  }

  return rows;
}

/**
 * Filters rows by component name while preserving tree order and indentation.
 * An empty query returns the rows untouched.
 */
export function filterComponentRows(
  rows: readonly ComponentTreeRow[],
  query: string,
): ComponentTreeRow[] {
  const trimmed = query.trim();
  if (!trimmed) return [...rows];
  return rows.filter(
    (row) => fuzzyScore(trimmed, row.node.displayName) !== null,
  );
}

/** `file:line[:column]` for display, or null when there is no file. */
export function formatSourceLocation(
  source:
    | { file: string; line?: number | null; column?: number | null }
    | null
    | undefined,
): string | null {
  if (!source?.file) return null;
  if (!source.line) return source.file;
  return source.column
    ? `${source.file}:${source.line}:${source.column}`
    : `${source.file}:${source.line}`;
}

/** Pretty prints an inspector value without ever throwing. */
export function formatInspectorValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
