import { NODE_KIND_META, NODE_KIND_ORDER } from "../lib/graph-model.js";
import type { GraphNodeView } from "../lib/graph-model.js";
import type { GraphTheme } from "../lib/graph-styles.js";
import { nodePalette } from "../lib/graph-styles.js";

export interface GraphLegendProps {
	readonly theme: GraphTheme;
	readonly nodes: readonly Pick<GraphNodeView, "kind">[];
}

export function GraphLegend({ theme, nodes }: GraphLegendProps) {
	const presentKinds = new Set(nodes.map((node) => node.kind));
	return (
		<div className="devtools:flex devtools:flex-wrap devtools:gap-2 devtools:border-t devtools:border-border devtools:px-2.5 devtools:py-1.5 devtools:text-[10px] devtools:text-muted-foreground">
			{NODE_KIND_ORDER.filter((kind) => presentKinds.has(kind)).map((kind) => {
				const palette = nodePalette(kind, theme);
				return (
					<span
						key={kind}
						className="devtools:inline-flex devtools:items-center devtools:gap-1"
					>
						<span
							className="devtools:size-2.5 devtools:rounded-[3px] devtools:border"
							style={{ background: palette.fill, borderColor: palette.border }}
						/>
						{NODE_KIND_META[kind].label}
					</span>
				);
			})}
			<span className="devtools:inline-flex devtools:items-center devtools:gap-1">
				<span className="devtools:w-4 devtools:border-t devtools:border-dashed devtools:border-muted-foreground" />
				Partial evidence
			</span>
		</div>
	);
}
