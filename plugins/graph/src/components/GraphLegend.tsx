import { NODE_KIND_META, NODE_KIND_ORDER } from "../lib/graph-model.js";
import type { GraphTheme } from "../lib/graph-styles.js";
import { nodePalette } from "../lib/graph-styles.js";

export interface GraphLegendProps {
	readonly theme: GraphTheme;
	readonly visibleKinds: ReadonlySet<string>;
}

export function GraphLegend({ theme, visibleKinds }: GraphLegendProps) {
	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: 8,
				padding: "6px 10px",
				fontSize: 10,
				color: "var(--muted-foreground)",
				borderTop: "1px solid var(--border, rgba(127,127,127,0.25))",
			}}
		>
			{NODE_KIND_ORDER.filter((kind) => visibleKinds.has(kind)).map((kind) => {
				const palette = nodePalette(kind, theme);
				return (
					<span
						key={kind}
						style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
					>
						<span
							style={{
								width: 10,
								height: 10,
								borderRadius: 3,
								background: palette.fill,
								border: `1.5px solid ${palette.border}`,
							}}
						/>
						{NODE_KIND_META[kind].label}
					</span>
				);
			})}
			<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
				<span
					style={{
						width: 16,
						height: 2,
						background: "var(--muted-foreground)",
						borderTop: "1.5px dashed var(--muted-foreground)",
					}}
				/>
				Partial evidence
			</span>
		</div>
	);
}
