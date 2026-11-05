import type { ComponentNode } from "@next-devtools/runtime-react";
import type { ComponentTreeRow as TreeRow } from "../component-tree-data.js";
import { formatSourceLocation } from "../component-tree-data.js";

const TREE_ROW_HEIGHT = 26;

type ComponentTreeItemProps = {
	node: ComponentNode;
	depth: number;
	rowIndex: number;
	selected: boolean;
	roving: boolean;
	query: string;
	collapsedIds: ReadonlySet<string>;
	siblingPosition: { position: number; size: number } | undefined;
	rows: readonly TreeRow[];
	onSelect: (id: string) => Promise<void>;
	onToggle: (id: string) => void;
	onRowFocus: (index: number) => void;
	onFocusRow: (index: number) => void;
	registerRef: (id: string, element: HTMLDivElement | null) => void;
};

export function ComponentTreeItem({
	node,
	depth,
	rowIndex,
	selected,
	roving,
	query,
	collapsedIds,
	siblingPosition,
	rows,
	onSelect,
	onToggle,
	onRowFocus,
	onFocusRow,
	registerRef,
}: ComponentTreeItemProps) {
	return (
		<div
			key={node.id}
			className="devtools-tree-row"
			ref={(element) => {
				if (element) registerRef(node.id, element);
				else registerRef(node.id, null);
			}}
			role="treeitem"
			tabIndex={roving ? 0 : -1}
			aria-selected={selected}
			aria-level={depth + 1}
			aria-posinset={siblingPosition?.position}
			aria-setsize={siblingPosition?.size}
			aria-expanded={
				node.childIds.length
					? !collapsedIds.has(node.id) || Boolean(query.trim())
					: undefined
			}
			title={formatSourceLocation(node.source) ?? node.displayName}
			onClick={() => void onSelect(node.id)}
			onFocus={() => onRowFocus(rowIndex)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					void onSelect(node.id);
					return;
				}
				if (event.key === "ArrowRight") {
					event.preventDefault();
					if (node.childIds.length && collapsedIds.has(node.id))
						onToggle(node.id);
					else if (rows[rowIndex + 1]?.depth === depth + 1)
						onFocusRow(rowIndex + 1);
				} else if (event.key === "ArrowLeft") {
					event.preventDefault();
					if (
						node.childIds.length &&
						!collapsedIds.has(node.id) &&
						!query.trim()
					)
						onToggle(node.id);
					else {
						const parentIndex = rows.findIndex(
							({ node: candidate }) => candidate.id === node.parentId,
						);
						if (parentIndex >= 0) onFocusRow(parentIndex);
					}
				} else if (event.key === "ArrowDown") {
					event.preventDefault();
					onFocusRow(rowIndex + 1);
				} else if (event.key === "ArrowUp") {
					event.preventDefault();
					onFocusRow(rowIndex - 1);
				} else if (event.key === "Home") {
					event.preventDefault();
					onFocusRow(0);
				} else if (event.key === "End") {
					event.preventDefault();
					onFocusRow(rows.length - 1);
				}
			}}
			style={{
				position: "absolute",
				top: rowIndex * TREE_ROW_HEIGHT,
				left: 0,
				right: 0,
				height: TREE_ROW_HEIGHT,
				display: "flex",
				alignItems: "center",
				gap: 6,
				width: "100%",
				textAlign: "left",
				padding: `3px 8px 3px ${8 + depth * 14}px`,
				border: "none",
				borderLeft: selected
					? "2px solid var(--primary)"
					: "2px solid transparent",
				background: selected ? "var(--accent)" : "transparent",
				color: "inherit",
				cursor: "pointer",
				fontSize: 12,
			}}
		>
			<button
				type="button"
				tabIndex={-1}
				aria-label={`${collapsedIds.has(node.id) ? "Expand" : "Collapse"} ${node.displayName}`}
				onClick={(event) => {
					if (!node.childIds.length || query.trim()) return;
					event.stopPropagation();
					onToggle(node.id);
				}}
				style={{
					width: 14,
					flex: "0 0 14px",
					color: "var(--muted-foreground)",
				}}
			>
				{node.childIds.length
					? collapsedIds.has(node.id) && !query.trim()
						? "▸"
						: "▾"
					: ""}
			</button>
			<span
				style={{
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
					fontFamily: node.kind === "host" ? "monospace" : undefined,
				}}
			>
				{node.displayName}
			</span>
			{node.hasState ? (
				<span
					aria-label="has state"
					title="Has state"
					style={{
						width: 6,
						height: 6,
						borderRadius: "50%",
						background: "var(--primary)",
						flex: "0 0 auto",
					}}
				/>
			) : null}
			<span
				style={{
					marginLeft: "auto",
					fontSize: 10,
					color: "var(--muted-foreground, #71717a)",
					flex: "0 0 auto",
				}}
			>
				{node.kind}
			</span>
		</div>
	);
}
