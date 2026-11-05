import type {
	DependencyEdgeKind,
	DependencyNodeKind,
} from "@next-devtools/runtime-react";
import { Toggle } from "@next-devtools/ui";
import {
	EDGE_KIND_META,
	EDGE_KIND_ORDER,
	NODE_KIND_META,
	NODE_KIND_ORDER,
} from "../lib/graph-model.js";

export interface GraphFiltersProps {
	readonly nodeKinds: ReadonlySet<DependencyNodeKind>;
	readonly onNodeKindsChange: (value: ReadonlySet<DependencyNodeKind>) => void;
	readonly edgeKinds: ReadonlySet<DependencyEdgeKind>;
	readonly onEdgeKindsChange: (value: ReadonlySet<DependencyEdgeKind>) => void;
}

export function GraphFilters({
	nodeKinds,
	onNodeKindsChange,
	edgeKinds,
	onEdgeKindsChange,
}: GraphFiltersProps) {
	const toggleNode = (kind: DependencyNodeKind, pressed: boolean) => {
		const next = new Set(nodeKinds);
		if (pressed) next.add(kind);
		else next.delete(kind);
		onNodeKindsChange(next);
	};
	const toggleEdge = (kind: DependencyEdgeKind, pressed: boolean) => {
		const next = new Set(edgeKinds);
		if (pressed) next.add(kind);
		else next.delete(kind);
		onEdgeKindsChange(next);
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 6,
				padding: "8px 10px",
				borderBottom: "1px solid var(--border, rgba(127,127,127,0.25))",
			}}
		>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					gap: 4,
				}}
			>
				<span
					style={{
						fontSize: 12,
						fontWeight: 600,
						color: "var(--muted-foreground)",
						marginRight: 4,
					}}
				>
					Nodes
				</span>
				{NODE_KIND_ORDER.map((kind) => (
					<Toggle
						key={kind}
						pressed={nodeKinds.has(kind)}
						onPressedChange={(pressed) => toggleNode(kind, pressed)}
						aria-label={`Toggle ${NODE_KIND_META[kind].label} nodes`}
					>
						{NODE_KIND_META[kind].shortLabel}
					</Toggle>
				))}
			</div>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					gap: 4,
				}}
			>
				<span
					style={{
						fontSize: 12,
						fontWeight: 600,
						color: "var(--muted-foreground)",
						marginRight: 4,
					}}
				>
					Edges
				</span>
				{EDGE_KIND_ORDER.map((kind) => (
					<Toggle
						key={kind}
						pressed={edgeKinds.has(kind)}
						onPressedChange={(pressed) => toggleEdge(kind, pressed)}
						aria-label={`Toggle ${EDGE_KIND_META[kind].label} edges`}
					>
						{EDGE_KIND_META[kind].label}
					</Toggle>
				))}
			</div>
		</div>
	);
}
