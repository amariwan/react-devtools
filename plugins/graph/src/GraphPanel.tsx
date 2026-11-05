import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { PluginRegistry } from "@next-devtools/core";
import type { ReactRuntimeService } from "@next-devtools/runtime-react";
import { Badge, PanelHeader } from "@next-devtools/ui";
import * as React from "react";
import { GraphCanvas } from "./components/GraphCanvas.js";
import { GraphFilters } from "./components/GraphFilters.js";
import { GraphLayoutSettings } from "./components/GraphLayoutSettings.js";
import { GraphLegend } from "./components/GraphLegend.js";
import { GraphNodeInspector } from "./components/GraphNodeInspector.js";
import { GraphStates } from "./components/GraphStates.js";
import { GraphToolbar } from "./components/GraphToolbar.js";
import { useCytoscape } from "./hooks/useCytoscape.js";
import { useGraphData } from "./hooks/useGraphData.js";
import { useGraphTheme } from "./hooks/useGraphTheme.js";
import {
	DEFAULT_FCOSE_SETTINGS,
	type FcoseSettings,
	type GraphLayoutName,
	clampFcoseSettings,
} from "./lib/graph-layout.js";
import {
	DEFAULT_GRAPH_DEPTH,
	DEFAULT_GRAPH_NODE_LIMIT,
	createDefaultEdgeFilters,
	createDefaultNodeFilters,
} from "./lib/graph-model.js";
import { buildGraphStylesheet } from "./lib/graph-styles.js";

export default function GraphPanel({ registry }: { registry: PluginRegistry }) {
	const service = registry.services.get<ReactRuntimeService>(
		RUNTIME_SERVICE_IDS.react,
	);

	const [query, setQuery] = React.useState("");
	const [layoutName, setLayoutName] = React.useState<GraphLayoutName>("fcose");
	const [animate, setAnimate] = React.useState(true);
	const [showEdgeLabels, setShowEdgeLabels] = React.useState(false);
	const [depth, setDepth] = React.useState(DEFAULT_GRAPH_DEPTH);
	const [nodeLimit] = React.useState(DEFAULT_GRAPH_NODE_LIMIT);
	const [nodeKinds, setNodeKinds] = React.useState(createDefaultNodeFilters());
	const [edgeKinds, setEdgeKinds] = React.useState(createDefaultEdgeFilters());
	const [fcoseSettings, setFcoseSettings] = React.useState<FcoseSettings>(
		DEFAULT_FCOSE_SETTINGS,
	);
	const [settingsOpen, setSettingsOpen] = React.useState(false);
	const [fullscreen, setFullscreen] = React.useState(false);
	const [layoutNonce, setLayoutNonce] = React.useState(0);
	const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
		null,
	);

	const graphData = useGraphData({
		service,
		depth,
		nodeLimit,
		nodeKinds,
		edgeKinds,
		query,
		...(selectedNodeId ? { selectedNodeId } : {}),
	});

	// Clear stale selection when root changes or node disappears.
	React.useEffect(() => {
		setSelectedNodeId(null);
	}, [graphData.rootComponentId]);
	React.useEffect(() => {
		if (!selectedNodeId) return;
		if (graphData.view.nodes.some((node) => node.id === selectedNodeId)) return;
		setSelectedNodeId(null);
	}, [graphData.view.nodes, selectedNodeId]);

	const themeContainerRef = React.useRef<HTMLDivElement | null>(null);
	const theme = useGraphTheme(themeContainerRef);

	const stylesheet = React.useMemo(() => buildGraphStylesheet(theme), [theme]);

	const controller = useCytoscape({
		nodes: graphData.view.nodes,
		edges: graphData.view.edges,
		stylesheet,
		layoutName,
		fcoseSettings,
		animate,
		showEdgeLabels,
		...(graphData.rootComponentId ? { rootId: graphData.rootComponentId } : {}),
		...(selectedNodeId ? { selectedNodeId } : {}),
		layoutNonce,
		onNodeSelect: (id) => setSelectedNodeId(id),
		onBackgroundSelect: () => setSelectedNodeId(null),
	});

	const containerRef = controller.containerRef;

	React.useEffect(() => {
		themeContainerRef.current = containerRef.current;
	}, [containerRef.current]);

	const focusComponent = React.useCallback(() => {
		if (graphData.rootComponentId) {
			controller.zoomTo(graphData.rootComponentId);
		}
	}, [controller, graphData.rootComponentId]);

	const exportGraph = React.useCallback(() => {
		if (typeof document === "undefined") return;
		const payload = {
			root: graphData.rootComponentId,
			nodes: graphData.view.nodes,
			edges: graphData.view.edges,
			limitations: graphData.view.limitations,
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "next-devtools-reactive-dependencies.json";
		anchor.click();
		URL.revokeObjectURL(url);
	}, [graphData]);

	const resetFilters = React.useCallback(() => {
		setNodeKinds(createDefaultNodeFilters());
		setEdgeKinds(createDefaultEdgeFilters());
		setQuery("");
	}, []);

	const rootLabel = graphData.view.rootLabel;
	const nodeCount = graphData.view.nodeCount;

	React.useEffect(() => {
		if (fullscreen && typeof document !== "undefined") {
			const previous = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = previous;
			};
		}
		return undefined;
	}, [fullscreen]);

	const wrapperStyle: React.CSSProperties = fullscreen
		? {
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				background: "var(--background, #0e0e10)",
				display: "flex",
				flexDirection: "column",
			}
		: {
				display: "flex",
				flexDirection: "column",
				height: "100%",
				minHeight: 0,
			};

	return (
		<div ref={themeContainerRef} style={wrapperStyle}>
			<PanelHeader
				title="Graph"
				description="Reactive dependencies of the selected component. Component hierarchy is never shown."
				actions={
					<Badge variant="secondary">
						{rootLabel ? rootLabel : "No selection"} · {nodeCount} nodes
					</Badge>
				}
			/>
			<GraphToolbar
				query={query}
				onQueryChange={setQuery}
				layoutName={layoutName}
				onLayoutChange={setLayoutName}
				depth={depth}
				onDepthChange={setDepth}
				animate={animate}
				onAnimateChange={setAnimate}
				showEdgeLabels={showEdgeLabels}
				onShowEdgeLabelsChange={setShowEdgeLabels}
				onFit={controller.fit}
				onReset={controller.resetView}
				onRunLayout={() => setLayoutNonce((value) => value + 1)}
				onFocus={focusComponent}
				onExport={exportGraph}
				onToggleFullscreen={() => setFullscreen((value) => !value)}
				fullscreen={fullscreen}
				onOpenSettings={() => setSettingsOpen(true)}
				loading={graphData.loading}
				nodeCount={nodeCount}
			/>
			<GraphFilters
				nodeKinds={nodeKinds}
				onNodeKindsChange={setNodeKinds}
				edgeKinds={edgeKinds}
				onEdgeKindsChange={setEdgeKinds}
			/>
			{graphData.view.nodeLimitReached ? (
				<div
					style={{
						padding: "4px 10px",
						fontSize: 11,
						color: "var(--warning, #d97706)",
						borderBottom: "1px solid var(--border, rgba(127,127,127,0.25))",
					}}
				>
					Node limit reached ({nodeLimit}). Lower-priority nodes are hidden.
				</div>
			) : null}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: fullscreen ? "1fr 320px" : "1fr 280px",
					gap: 0,
					flex: 1,
					minHeight: 0,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						minHeight: 0,
						overflow: "hidden",
					}}
				>
					<GraphCanvas
						controller={controller}
						theme={theme}
						view={graphData.view}
						containerRef={containerRef}
						onNodeSelect={(id) => setSelectedNodeId(id)}
						onBackgroundSelect={() => setSelectedNodeId(null)}
						height={
							fullscreen
								? Math.max(
										320,
										(typeof window !== "undefined" ? window.innerHeight : 600) -
											140,
									)
								: 420
						}
					/>
					<GraphStates
						view={graphData.view}
						runtimeStatus={graphData.runtimeStatus}
						dependenciesCapable={graphData.dependenciesCapable}
						dependencySetLoaded={graphData.loaded}
						loading={graphData.loading}
						{...(graphData.dependencyError
							? { dependencyError: graphData.dependencyError }
							: {})}
						onReload={graphData.reload}
						onResetFilters={resetFilters}
						hiddenByKind={graphData.view.hiddenByKind}
					/>
					<GraphLegend theme={theme} visibleKinds={nodeKinds} />
				</div>
				<div
					style={{
						borderLeft: "1px solid var(--border, rgba(127,127,127,0.25))",
						overflow: "auto",
						minHeight: 0,
					}}
				>
					<GraphNodeInspector
						view={graphData.view}
						selectedNodeId={selectedNodeId}
						onSelectNode={(id) => setSelectedNodeId(id)}
					/>
				</div>
			</div>
			<GraphLayoutSettings
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				settings={fcoseSettings}
				onSettingsChange={(value) => {
					setFcoseSettings(clampFcoseSettings(value));
					setLayoutNonce((n) => n + 1);
				}}
				nodeCount={nodeCount}
			/>
		</div>
	);
}
