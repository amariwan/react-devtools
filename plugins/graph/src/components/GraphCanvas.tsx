import * as React from "react";
import type { CytoscapeController } from "../hooks/useCytoscape.js";
import type { GraphView } from "../lib/graph-model.js";
import { EVIDENCE_META, NODE_KIND_META } from "../lib/graph-model.js";
import type { GraphTheme } from "../lib/graph-styles.js";

export interface GraphCanvasProps {
	readonly controller: CytoscapeController;
	readonly theme: GraphTheme;
	readonly view: GraphView;
	readonly containerRef: React.RefObject<HTMLDivElement | null>;
	readonly selectedNodeId: string | null;
	readonly onNodeSelect: (id: string) => void;
	readonly accessible?: boolean;
}

/**
 * Cytoscape renders to a canvas inside this container. The container must
 * retain its dimensions across data updates, so it is a stable element rather
 * than being recreated.
 */
export function GraphCanvas({
	controller,
	theme,
	view,
	containerRef,
	selectedNodeId,
	onNodeSelect,
	accessible = true,
}: GraphCanvasProps) {
	const accessibleListRef = React.useRef<HTMLDetailsElement | null>(null);
	const selectAccessibleNode = (id: string) => {
		onNodeSelect(id);
		controller.zoomTo(id);
		const details = accessibleListRef.current;
		if (!details) return;
		details.open = false;
		details.querySelector("summary")?.focus();
	};

	return (
		<div className="graph-canvas-shell devtools:relative devtools:size-full devtools:min-h-0 devtools:flex-[1_1_auto]">
			<div
				ref={containerRef}
				role="img"
				data-layout-state={
					controller.layoutPending
						? "running"
						: controller.layoutDurationMs === null
							? "idle"
							: "complete"
				}
				data-layout-duration-ms={controller.layoutDurationMs ?? undefined}
				aria-label={`Reactive dependency graph for ${view.rootLabel ?? "selected component"}. ${view.nodeCount} nodes, ${view.edgeCount} edges.`}
				className="devtools:size-full devtools:overflow-hidden devtools:rounded-md devtools:cursor-grab"
				style={{ background: theme.background }}
			/>
			{!controller.ready ? (
				<div className="devtools:pointer-events-none devtools:absolute devtools:inset-0 devtools:flex devtools:items-center devtools:justify-center devtools:text-xs devtools:text-muted-foreground">
					Initializing graph…
				</div>
			) : null}
			{controller.layoutPending ? (
				<div
					role="status"
					className="devtools:pointer-events-none devtools:absolute devtools:right-2 devtools:top-2 devtools:rounded-md devtools:border devtools:border-border devtools:bg-card/95 devtools:px-2 devtools:py-1 devtools:text-xs devtools:text-muted-foreground"
				>
					Arranging graph…
				</div>
			) : null}
			{accessible ? (
				<details
					ref={accessibleListRef}
					className="devtools:absolute devtools:bottom-2 devtools:left-2 devtools:max-w-[260px] devtools:rounded-md devtools:border devtools:border-border devtools:bg-card devtools:px-2 devtools:py-1 devtools:text-xs devtools:text-muted-foreground"
				>
					<summary className="devtools:cursor-pointer devtools:font-medium">
						Accessible node list
					</summary>
					<div className="devtools:mt-1.5 devtools:flex devtools:max-h-[180px] devtools:flex-col devtools:gap-0.5 devtools:overflow-auto">
						{view.nodes.map((node) => (
							<button
								key={node.id}
								type="button"
								aria-pressed={node.id === selectedNodeId}
								onClick={() => selectAccessibleNode(node.id)}
								className="devtools:cursor-pointer devtools:bg-transparent devtools:py-0.5 devtools:text-left devtools:text-xs devtools:text-foreground devtools:hover:text-primary devtools:focus-visible:outline-none devtools:focus-visible:underline"
							>
								{node.label} · {NODE_KIND_META[node.kind].label} ·{" "}
								{EVIDENCE_META[node.evidence].label}
							</button>
						))}
					</div>
				</details>
			) : null}
		</div>
	);
}
