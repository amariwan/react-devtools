import type {
	DependencyEdgeKind,
	DependencyNodeKind,
} from "@next-devtools/runtime-react";
import {
	CircleDot,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Toggle,
	Toolbar,
	Workflow,
} from "@next-devtools/ui";
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
		<Toolbar className="devtools:items-start devtools:gap-2 devtools:px-3 devtools:py-2">
			<Collapsible>
				<CollapsibleTrigger
					type="button"
					aria-label={`Node type filters, ${nodeKinds.size} of ${NODE_KIND_ORDER.length} enabled`}
					title="Node type filters"
					className="devtools:inline-flex devtools:cursor-pointer devtools:items-center devtools:gap-1 devtools:rounded-md devtools:px-2 devtools:py-1.5 devtools:text-xs devtools:font-medium devtools:text-muted-foreground devtools:hover:bg-muted devtools:focus-visible:outline-none devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring"
				>
					<CircleDot size={14} aria-hidden="true" />
					<span className="devtools:font-mono devtools:tabular-nums">
						{nodeKinds.size}/{NODE_KIND_ORDER.length}
					</span>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div
						role="group"
						aria-label="Node type filters"
						className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-1.5 devtools:pt-2"
					>
						{NODE_KIND_ORDER.map((kind) => (
							<Toggle
								key={kind}
								pressed={nodeKinds.has(kind)}
								onPressedChange={(pressed) => toggleNode(kind, pressed)}
								aria-label={`Toggle ${NODE_KIND_META[kind].label} nodes`}
								title={NODE_KIND_META[kind].description}
								className="devtools:h-7 devtools:px-2 devtools:text-xs"
							>
								{NODE_KIND_META[kind].label}
							</Toggle>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
			<Collapsible>
				<CollapsibleTrigger
					type="button"
					aria-label={`Relationship filters, ${edgeKinds.size} of ${EDGE_KIND_ORDER.length} enabled`}
					title="Relationship filters"
					className="devtools:inline-flex devtools:cursor-pointer devtools:items-center devtools:gap-1 devtools:rounded-md devtools:px-2 devtools:py-1.5 devtools:text-xs devtools:font-medium devtools:text-muted-foreground devtools:hover:bg-muted devtools:focus-visible:outline-none devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring"
				>
					<Workflow size={14} aria-hidden="true" />
					<span className="devtools:font-mono devtools:tabular-nums">
						{edgeKinds.size}/{EDGE_KIND_ORDER.length}
					</span>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div
						role="group"
						aria-label="Relationship filters"
						className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-1.5 devtools:pt-2"
					>
						{EDGE_KIND_ORDER.map((kind) => (
							<Toggle
								key={kind}
								pressed={edgeKinds.has(kind)}
								onPressedChange={(pressed) => toggleEdge(kind, pressed)}
								aria-label={`Toggle ${EDGE_KIND_META[kind].label} edges`}
								title={EDGE_KIND_META[kind].description}
								className="devtools:h-7 devtools:px-2 devtools:text-xs"
							>
								{EDGE_KIND_META[kind].label}
							</Toggle>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Toolbar>
	);
}
