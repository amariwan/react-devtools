import type * as React from "react";
import type { CytoscapeController } from "../hooks/useCytoscape.js";
import type { GraphView } from "../lib/graph-model.js";
import { EVIDENCE_META, NODE_KIND_META } from "../lib/graph-model.js";
import type { GraphTheme } from "../lib/graph-styles.js";

export interface GraphCanvasProps {
	readonly controller: CytoscapeController;
	readonly theme: GraphTheme;
	readonly view: GraphView;
	readonly containerRef: React.RefObject<HTMLDivElement | null>;
	readonly onNodeSelect: (id: string) => void;
	readonly onBackgroundSelect: () => void;
	readonly height?: number;
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
	height = 460,
	accessible = true,
}: GraphCanvasProps) {
	return (
		<div
			className="graph-canvas-shell"
			style={{ position: "relative", height }}
		>
			<div
				ref={containerRef}
				role="img"
				aria-label={`Reactive dependency graph for ${view.rootLabel ?? "selected component"}. ${view.nodeCount} nodes, ${view.edgeCount} edges.`}
				style={{
					width: "100%",
					height: "100%",
					background: theme.background,
					borderRadius: 8,
					overflow: "hidden",
					cursor: "grab",
				}}
			/>
			{!controller.ready ? (
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: theme.muted,
						fontSize: 12,
						pointerEvents: "none",
					}}
				>
					Initializing graph…
				</div>
			) : null}
			{accessible ? (
				<details
					style={{
						position: "absolute",
						bottom: 8,
						left: 8,
						background: theme.surface,
						border: `1px solid ${theme.border}`,
						borderRadius: 6,
						padding: "4px 8px",
						fontSize: 11,
						color: theme.muted,
						maxWidth: 260,
					}}
				>
					<summary style={{ cursor: "pointer", fontWeight: 500 }}>
						Accessible node list
					</summary>
					<div
						style={{
							marginTop: 6,
							maxHeight: 180,
							overflow: "auto",
							display: "flex",
							flexDirection: "column",
							gap: 2,
						}}
					>
						{view.nodes.map((node) => (
							<button
								key={node.id}
								type="button"
								onClick={() => controller.zoomTo(node.id)}
								style={{
									textAlign: "left",
									background: "transparent",
									border: "none",
									color: theme.text,
									fontSize: 11,
									cursor: "pointer",
									padding: "2px 0",
								}}
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
