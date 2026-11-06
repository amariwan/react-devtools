import {
	Checkbox,
	Download,
	Expand,
	Focus,
	IconButton,
	Maximize,
	Minimize,
	Popover,
	PopoverContent,
	PopoverTrigger,
	RotateCcw,
	SearchField,
	Select,
	Settings2,
	Toolbar,
	Workflow,
} from "@next-devtools/ui";
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
		<Toolbar
			aria-label="Graph controls"
			role="group"
			className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-3 devtools:py-2"
		>
			<SearchField
				value={query}
				onChange={onQueryChange}
				placeholder="Search nodes…"
				aria-label="Graph node search"
				className="devtools:min-w-40 devtools:flex-[1_1_180px]"
			/>
			<Popover>
				<PopoverTrigger
					render={
						<IconButton
							icon={Settings2}
							label="View options"
							variant="outline"
						/>
					}
				/>
				<PopoverContent className="devtools:w-64 devtools:max-w-[calc(100vw-2rem)] devtools:p-2">
					<div
						aria-label="Graph layout and scope"
						role="group"
						className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2"
					>
						<Select
							value={layoutName}
							onChange={(value) => onLayoutChange(value as GraphLayoutName)}
							options={GRAPH_LAYOUTS.map((layout) => ({
								value: layout.value,
								label: layout.label,
							}))}
							aria-label="Graph layout"
						/>
						<label className="devtools:flex devtools:items-center devtools:gap-1.5 devtools:text-xs">
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
						</label>
					</div>
					<div
						aria-label="Graph display options"
						role="group"
						className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2"
					>
						<label className="devtools:flex devtools:items-center devtools:gap-1.5 devtools:text-xs">
							<Checkbox
								checked={animate}
								onCheckedChange={onAnimateChange}
								aria-label="Animate layout"
							/>
							Animate layout
						</label>
						<label className="devtools:flex devtools:items-center devtools:gap-1.5 devtools:text-xs">
							<Checkbox
								checked={showEdgeLabels}
								onCheckedChange={onShowEdgeLabelsChange}
								aria-label="Edge labels"
							/>
							Edge labels
						</label>
					</div>
				</PopoverContent>
			</Popover>
			<div
				aria-label="Graph view actions"
				role="group"
				className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-1"
			>
				<IconButton
					icon={Expand}
					label="Fit graph to view"
					variant="outline"
					onClick={onFit}
					disabled={loading || nodeCount === 0}
				/>
				<IconButton
					icon={RotateCcw}
					label="Reset graph view"
					variant="outline"
					onClick={onReset}
					disabled={loading || nodeCount === 0}
				/>
				<IconButton
					icon={Workflow}
					label="Run graph layout"
					variant="outline"
					onClick={onRunLayout}
					disabled={loading || nodeCount === 0}
				/>
				<IconButton
					icon={Focus}
					label="Focus root component"
					variant="outline"
					onClick={onFocus}
					disabled={loading}
				/>
				<IconButton
					icon={Settings2}
					label="Graph settings"
					variant="outline"
					onClick={onOpenSettings}
				/>
				<IconButton
					icon={Download}
					label="Export graph"
					variant="outline"
					onClick={onExport}
					disabled={nodeCount === 0}
				/>
				<IconButton
					icon={fullscreen ? Minimize : Maximize}
					label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
					variant="ghost"
					onClick={onToggleFullscreen}
				/>
			</div>
		</Toolbar>
	);
}
