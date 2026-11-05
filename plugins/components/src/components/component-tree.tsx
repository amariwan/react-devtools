import type { ComponentNode } from "@next-devtools/runtime-react";
import * as React from "react";
import {
	filterComponentRows,
	flattenComponentTree,
} from "../component-tree-data.js";
import { ComponentTreeItem } from "./component-tree-item.js";
import { ComponentTreeToolbar } from "./component-tree-toolbar.js";

const TREE_ROW_HEIGHT = 26;
const TREE_VIEWPORT_HEIGHT = 420;
const TREE_OVERSCAN_ROWS = 8;

type ComponentTreeProps = {
	tree: readonly ComponentNode[];
	roots: readonly string[];
	activeRootId: string | null;
	selectedId: string | null;
	onRootChange: (id: string) => void;
	onSelect: (id: string) => Promise<void>;
	onRefresh: () => Promise<void>;
};

export function ComponentTree({
	tree,
	roots,
	activeRootId,
	selectedId,
	onRootChange,
	onSelect,
	onRefresh,
}: ComponentTreeProps) {
	const [query, setQuery] = React.useState("");
	const [treeScrollTop, setTreeScrollTop] = React.useState(0);
	const [focusedTreeRow, setFocusedTreeRow] = React.useState<number | null>(
		null,
	);
	const treeContainerRef = React.useRef<HTMLDivElement | null>(null);
	const treeItemRefs = React.useRef(new Map<string, HTMLDivElement>());
	const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(
		() => new Set(),
	);
	const toggleExpanded = (id: string) =>
		setCollapsedIds((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	const rows = React.useMemo(() => {
		const flattened = flattenComponentTree(tree);
		if (query.trim()) return filterComponentRows(flattened, query);
		let hiddenBelow: number | null = null;
		return flattened.filter(({ node, depth }) => {
			if (hiddenBelow !== null && depth > hiddenBelow) return false;
			hiddenBelow = collapsedIds.has(node.id) ? depth : null;
			return true;
		});
	}, [tree, query, collapsedIds]);
	const siblingPosition = React.useMemo(() => {
		const groups = new Map<string | null, string[]>();
		for (const node of tree) {
			const siblings = groups.get(node.parentId) ?? [];
			siblings.push(node.id);
			groups.set(node.parentId, siblings);
		}
		const positions = new Map<string, { position: number; size: number }>();
		for (const siblings of groups.values()) {
			siblings.forEach((id, index) =>
				positions.set(id, { position: index + 1, size: siblings.length }),
			);
		}
		return positions;
	}, [tree]);
	const updateQuery = (value: string) => {
		setQuery(value);
		setFocusedTreeRow(null);
		setTreeScrollTop(0);
		if (treeContainerRef.current) treeContainerRef.current.scrollTop = 0;
	};

	const revealedSelection = React.useRef<string | null>(null);
	const scrolledSelection = React.useRef<string | null>(null);
	React.useEffect(() => {
		if (!selectedId || revealedSelection.current === selectedId) return;
		if (!tree.some((node) => node.id === selectedId)) return;
		revealedSelection.current = selectedId;
		// A DOM pick may select a descendant inside a collapsed branch.
		const ancestors = new Set<string>();
		let parentId = tree.find((node) => node.id === selectedId)?.parentId;
		while (parentId && !ancestors.has(parentId)) {
			ancestors.add(parentId);
			parentId = tree.find((node) => node.id === parentId)?.parentId;
		}
		setCollapsedIds((current) => {
			if (![...ancestors].some((id) => current.has(id))) return current;
			return new Set([...current].filter((id) => !ancestors.has(id)));
		});
	}, [selectedId, tree]);

	React.useEffect(() => {
		if (!selectedId || scrolledSelection.current === selectedId) return;
		const index = rows.findIndex(({ node }) => node.id === selectedId);
		const container = treeContainerRef.current;
		if (index < 0 || !container) return;
		scrolledSelection.current = selectedId;
		const top = index * TREE_ROW_HEIGHT;
		if (top < container.scrollTop) container.scrollTop = top;
		else if (
			top + TREE_ROW_HEIGHT >
			container.scrollTop + container.clientHeight
		)
			container.scrollTop = top + TREE_ROW_HEIGHT - container.clientHeight;
		setTreeScrollTop(container.scrollTop);
	}, [selectedId, rows]);

	const firstVisibleRow = Math.max(
		0,
		Math.floor(treeScrollTop / TREE_ROW_HEIGHT) - TREE_OVERSCAN_ROWS,
	);
	const lastVisibleRow = Math.min(
		rows.length,
		Math.ceil((treeScrollTop + TREE_VIEWPORT_HEIGHT) / TREE_ROW_HEIGHT) +
			TREE_OVERSCAN_ROWS,
	);
	const selectedRowIndex = selectedId
		? rows.findIndex(({ node }) => node.id === selectedId)
		: -1;
	const rovingRowIndex =
		focusedTreeRow ?? (selectedRowIndex >= 0 ? selectedRowIndex : 0);
	const focusTreeRow = React.useCallback(
		(rowIndex: number) => {
			if (rows.length === 0) return;
			const nextIndex = Math.max(0, Math.min(rowIndex, rows.length - 1));
			const container = treeContainerRef.current;
			const top = nextIndex * TREE_ROW_HEIGHT;
			if (container) {
				if (top < container.scrollTop) container.scrollTop = top;
				else if (
					top + TREE_ROW_HEIGHT >
					container.scrollTop + container.clientHeight
				)
					container.scrollTop = top + TREE_ROW_HEIGHT - container.clientHeight;
			}
			setFocusedTreeRow(nextIndex);
			const id = rows[nextIndex]?.node.id;
			if (!id) return;
			requestAnimationFrame(() => treeItemRefs.current.get(id)?.focus());
		},
		[rows],
	);

	return (
		<div
			className="devtools-component-tree"
			style={{
				flex: "1 1 55%",
				minWidth: 0,
				display: "flex",
				flexDirection: "column",
				border: "1px solid var(--border, #e4e4e7)",
				borderRadius: 6,
			}}
		>
			<ComponentTreeToolbar
				query={query}
				roots={roots}
				activeRootId={activeRootId}
				onQueryChange={updateQuery}
				onRootChange={onRootChange}
				onRefresh={onRefresh}
			/>
			<div
				ref={treeContainerRef}
				role="tree"
				aria-label="React component tree"
				style={{
					overflow: "auto",
					flex: 1,
					height: TREE_VIEWPORT_HEIGHT,
					maxHeight: TREE_VIEWPORT_HEIGHT,
					padding: "4px 0",
				}}
				onScroll={(event) => setTreeScrollTop(event.currentTarget.scrollTop)}
			>
				{rows.length === 0 ? (
					<div
						style={{
							padding: 16,
							fontSize: 12,
							color: "var(--muted-foreground, #71717a)",
							textAlign: "center",
						}}
					>
						{tree.length === 0
							? "No components found in this React root yet."
							: "No components match the filter."}
					</div>
				) : (
					<div
						style={{
							position: "relative",
							height: rows.length * TREE_ROW_HEIGHT,
						}}
					>
						{rows
							.slice(firstVisibleRow, lastVisibleRow)
							.map(({ node, depth }, visibleIndex) => {
								const rowIndex = firstVisibleRow + visibleIndex;
								const selected = node.id === selectedId;
								return (
									<ComponentTreeItem
										key={node.id}
										node={node}
										depth={depth}
										rowIndex={rowIndex}
										selected={selected}
										roving={rowIndex === rovingRowIndex}
										query={query}
										collapsedIds={collapsedIds}
										siblingPosition={siblingPosition.get(node.id)}
										rows={rows}
										onSelect={onSelect}
										onToggle={toggleExpanded}
										onRowFocus={setFocusedTreeRow}
										onFocusRow={focusTreeRow}
										registerRef={(id, element) => {
											if (element) treeItemRefs.current.set(id, element);
											else treeItemRefs.current.delete(id);
										}}
									/>
								);
							})}
					</div>
				)}
			</div>
		</div>
	);
}
