import { Button, SearchField, Select } from "@next-devtools/ui";
import type { GraphLayoutName } from "../lib/graph-layout.js";
import { GRAPH_LAYOUTS } from "../lib/graph-layout.js";

export interface GraphToolbarProps {
	readonly query: string;
	readonly onQueryChange: (value: string) => void;
	readonly layoutName: GraphLayoutName;
	readonly onLayoutChange: (value: GraphLayoutName) => void;
	readonly depth: number;
	readonly onDepthChange: (value: number) => void;
	readonly animate: boolean;
	readonly onAnimateChange: (value: boolean) => void;
	readonly showEdgeLabels: boolean;
	readonly onShowEdgeLabelsChange: (value: boolean) => void;
	readonly onFit: () => void;
	readonly onReset: () => void;
	readonly onRunLayout: () => void;
	readonly onFocus: () => void;
	readonly onExport: () => void;
	readonly onToggleFullscreen: () => void;
	readonly fullscreen: boolean;
	readonly onOpenSettings: () => void;
	readonly loading: boolean;
	readonly nodeCount: number;
}

export function GraphToolbar({
	query,
	onQueryChange,
	layoutName,
	onLayoutChange,
	depth,
	onDepthChange,
	animate,
	onAnimateChange,
	showEdgeLabels,
	onShowEdgeLabelsChange,
	onFit,
	onReset,
	onRunLayout,
	onFocus,
	onExport,
	onToggleFullscreen,
	fullscreen,
	onOpenSettings,
	loading,
	nodeCount,
}: GraphToolbarProps) {
	return (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: 6,
				alignItems: "center",
				padding: "6px 8px",
				borderBottom: "1px solid var(--border, rgba(127,127,127,0.25))",
			}}
		>
			<SearchField
				value={query}
				onChange={onQueryChange}
				placeholder="Search nodes…"
				aria-label="Graph node search"
				style={{ minWidth: 160, flex: "1 1 180px" }}
			/>
			<Select
				value={layoutName}
				onChange={(value) => onLayoutChange(value as GraphLayoutName)}
				options={GRAPH_LAYOUTS.map((layout) => ({
					value: layout.value,
					label: layout.label,
				}))}
				aria-label="Graph layout"
			/>
			<span
				style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
			>
				Depth
				<Select
					value={String(depth)}
					onChange={(value) => onDepthChange(Number(value))}
					options={[
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
						{ value: "3", label: "3" },
					]}
					aria-label="Graph depth"
				/>
			</span>
			<label
				style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
			>
				<input
					type="checkbox"
					checked={animate}
					onChange={(event) => onAnimateChange(event.target.checked)}
				/>
				Animate
			</label>
			<label
				style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
			>
				<input
					type="checkbox"
					checked={showEdgeLabels}
					onChange={(event) => onShowEdgeLabelsChange(event.target.checked)}
				/>
				Labels
			</label>
			<Button
				size="sm"
				variant="outline"
				onClick={onFit}
				disabled={loading || nodeCount === 0}
			>
				Fit
			</Button>
			<Button
				size="sm"
				variant="outline"
				onClick={onReset}
				disabled={loading || nodeCount === 0}
			>
				Reset
			</Button>
			<Button
				size="sm"
				variant="outline"
				onClick={onRunLayout}
				disabled={loading || nodeCount === 0}
			>
				Layout
			</Button>
			<Button size="sm" variant="outline" onClick={onFocus} disabled={loading}>
				Focus
			</Button>
			<Button size="sm" variant="outline" onClick={onOpenSettings}>
				Settings
			</Button>
			<Button
				size="sm"
				variant="outline"
				onClick={onExport}
				disabled={nodeCount === 0}
			>
				Export
			</Button>
			<Button size="sm" variant="ghost" onClick={onToggleFullscreen}>
				{fullscreen ? "Exit" : "Fullscreen"}
			</Button>
		</div>
	);
}
