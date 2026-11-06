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
	const containerRef = React.useRef<HTMLDivElement | null>(null);

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

	const theme = useGraphTheme(containerRef);

	const stylesheet = React.useMemo(() => buildGraphStylesheet(theme), [theme]);

	const controller = useCytoscape({
		containerRef,
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

	const rootLabel =
		graphData.view.rootLabel ??
		graphData.snapshot.data.tree.find(
			(node) => node.id === graphData.rootComponentId,
		)?.displayName ??
		(graphData.rootComponentId ? "Selected component" : undefined);
	const nodeCount = graphData.view.nodeCount;
	const hasSelectedNode =
		selectedNodeId !== null &&
		graphData.view.nodes.some((node) => node.id === selectedNodeId);
	const showInlineEmptyState =
		graphData.view.status === "empty" &&
		Boolean(graphData.view.rootComponentId) &&
		graphData.dependenciesCapable &&
		graphData.loaded &&
		!graphData.loading &&
		graphData.runtimeStatus !== "error" &&
		graphData.runtimeStatus !== "unavailable" &&
		!graphData.dependencyError;
	const showGraphStateOverlay =
		graphData.loading ||
		graphData.runtimeStatus === "error" ||
		graphData.runtimeStatus === "unavailable" ||
		Boolean(graphData.dependencyError) ||
		graphData.view.status === "unavailable" ||
		graphData.view.status === "unsupported" ||
		(graphData.view.status === "empty" && !showInlineEmptyState);
	const graphState = (
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
			compact={showInlineEmptyState}
		/>
	);

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

	return (
		<div
			className={
				fullscreen
					? "devtools:fixed devtools:inset-0 devtools:z-[9999] devtools:flex devtools:flex-col devtools:bg-background"
					: "devtools:flex devtools:h-full devtools:min-h-0 devtools:flex-col"
			}
		>
			<PanelHeader
				title="Graph"
				description="Dependencies of the selected component"
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
				<div className="devtools:border-b devtools:border-border devtools:px-2.5 devtools:py-1 devtools:text-[11px] devtools:text-warning">
					Node limit reached ({nodeLimit}). Lower-priority nodes are hidden.
				</div>
			) : null}
			<div
				className={`devtools-graph-layout devtools:grid devtools:min-h-0 devtools:flex-1 devtools:overflow-hidden devtools:@max-[640px]/devtools:grid-cols-[minmax(0,1fr)] ${hasSelectedNode ? "devtools:@max-[640px]/devtools:grid-rows-[minmax(180px,1fr)_auto]" : ""} ${hasSelectedNode ? (fullscreen ? "devtools:grid-cols-[minmax(0,1fr)_320px]" : "devtools:grid-cols-[minmax(0,1fr)_280px]") : "devtools:grid-cols-[minmax(0,1fr)]"}`}
			>
				<div className="devtools:flex devtools:min-h-0 devtools:flex-col devtools:overflow-hidden">
					<div className="devtools-graph-viewport devtools:relative devtools:min-h-[220px] devtools:flex-1 devtools:overflow-hidden devtools:@max-[640px]/devtools:min-h-[180px]">
						<GraphCanvas
							controller={controller}
							theme={theme}
							view={graphData.view}
							containerRef={containerRef}
							selectedNodeId={selectedNodeId}
							onNodeSelect={(id) => setSelectedNodeId(id)}
						/>
						{nodeCount > 0 && !hasSelectedNode ? (
							<div className="devtools:pointer-events-none devtools:absolute devtools:right-2 devtools:top-2 devtools:max-w-[220px] devtools:rounded-md devtools:border devtools:border-border devtools:bg-background/90 devtools:px-2 devtools:py-1.5 devtools:text-xs devtools:text-muted-foreground">
								Select a node to inspect its reactive metadata
							</div>
						) : null}
						{showGraphStateOverlay ? (
							<div className="devtools:pointer-events-none devtools:absolute devtools:inset-0 devtools:grid devtools:place-items-center devtools:p-4">
								<div className="devtools:pointer-events-auto devtools:w-full devtools:max-w-[420px]">
									{graphState}
								</div>
							</div>
						) : null}
					</div>
					{showInlineEmptyState ? graphState : null}
					<GraphLegend theme={theme} nodes={graphData.view.nodes} />
				</div>
				{hasSelectedNode ? (
					<div className="devtools-graph-inspector devtools:min-h-0 devtools:overflow-auto devtools:border-l devtools:border-border devtools:@max-[640px]/devtools:max-h-[180px] devtools:@max-[640px]/devtools:border-t devtools:@max-[640px]/devtools:border-l-0">
						<GraphNodeInspector
							view={graphData.view}
							selectedNodeId={selectedNodeId}
							onSelectNode={(id) => setSelectedNodeId(id)}
						/>
					</div>
				) : null}
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
