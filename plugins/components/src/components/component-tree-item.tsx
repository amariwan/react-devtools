import type { ComponentNode } from "@next-devtools/runtime-react";
import { Button, ChevronDown, ChevronRight, cn } from "@next-devtools/ui";
import type { ComponentTreeRow as TreeRow } from "../component-tree-data.js";
import { formatSourceLocation } from "../component-tree-data.js";

const TREE_ROW_HEIGHT = 28;

type ComponentTreeItemProps = {
	node: ComponentNode;
	depth: number;
	rowIndex: number;
	selected: boolean;
	roving: boolean;
	matchesQuery?: boolean;
	query: string;
	collapsedIds: ReadonlySet<string>;
	siblingPosition: { position: number; size: number } | undefined;
	rows: readonly TreeRow[];
	highlighted?: boolean;
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
	matchesQuery = false,
	query,
	collapsedIds,
	siblingPosition,
	rows,
	highlighted = false,
	onSelect,
	onToggle,
	onRowFocus,
	onFocusRow,
	registerRef,
}: ComponentTreeItemProps) {
	const hasChildren = node.childIds.length > 0;
	const isSearching = Boolean(query.trim());
	const isExpanded = !collapsedIds.has(node.id) || isSearching;
	const canToggle = hasChildren && !isSearching;

	return (
		<div
			key={node.id}
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
			aria-expanded={hasChildren ? isExpanded : undefined}
			data-updated={highlighted || undefined}
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
					if (canToggle && !isExpanded) onToggle(node.id);
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
			className={cn(
				"devtools:absolute devtools:inset-x-0 devtools:flex devtools:h-7 devtools:items-center devtools:gap-1.5 devtools:border-l-2 devtools:py-[2px] devtools:pr-2 devtools:text-left devtools:text-xs devtools:text-foreground devtools:transition-colors devtools:duration-100 devtools:motion-reduce:transition-none devtools:focus-visible:z-10 devtools:focus-visible:outline-none devtools:focus-visible:ring-2 devtools:focus-visible:ring-inset devtools:focus-visible:ring-ring",
				selected
					? "devtools:border-l-primary devtools:bg-accent"
					: "devtools:border-l-transparent devtools:bg-transparent devtools:hover:bg-muted/70",
				highlighted && "devtools-component-update-highlight",
			)}
			style={{ top: rowIndex * TREE_ROW_HEIGHT, paddingLeft: 8 + depth * 14 }}
		>
			{canToggle ? (
				<Button
					type="button"
					tabIndex={-1}
					variant="ghost"
					size="icon-xs"
					aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.displayName}`}
					onClick={(event) => {
						event.stopPropagation();
						onToggle(node.id);
					}}
					className="devtools:shrink-0 devtools:text-muted-foreground"
				>
					{isExpanded ? (
						<ChevronDown aria-hidden="true" className="devtools:size-3.5" />
					) : (
						<ChevronRight aria-hidden="true" className="devtools:size-3.5" />
					)}
				</Button>
			) : (
				<span
					aria-hidden="true"
					className="devtools:flex devtools:size-6 devtools:shrink-0 devtools:items-center devtools:justify-center"
				>
					{hasChildren ? <ChevronDown className="devtools:size-3.5" /> : null}
				</span>
			)}
			<span
				className={cn(
					"devtools:min-w-0 devtools:overflow-hidden devtools:text-ellipsis devtools:whitespace-nowrap",
					matchesQuery &&
						"devtools:rounded-sm devtools:bg-primary/10 devtools:px-1 devtools:font-semibold devtools:text-primary",
					node.kind === "host" && "devtools:font-mono",
				)}
			>
				{node.displayName}
			</span>
			{node.hasState ? (
				<span
					aria-label="has state"
					title="Has state"
					className="devtools:size-1.5 devtools:shrink-0 devtools:rounded-full devtools:bg-primary"
				/>
			) : null}
			<span className="devtools:ml-auto devtools:shrink-0 devtools:text-[10px] devtools:text-muted-foreground">
				{node.kind}
			</span>
		</div>
	);
}
