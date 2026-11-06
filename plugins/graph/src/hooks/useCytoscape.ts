import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import fcose from "cytoscape-fcose";
import * as React from "react";
import {
	type FcoseSettings,
	type GraphLayoutName,
	buildLayoutOptions,
	seededPosition,
	shouldHideGraphLabels,
} from "../lib/graph-layout.js";
import type { GraphEdgeView, GraphNodeView } from "../lib/graph-model.js";

let extensionsRegistered = false;

function registerExtensions(): void {
	if (extensionsRegistered) return;
	try {
		cytoscape.use(fcose);
	} catch {
		/* duplicate registration is safe to ignore */
	}
	try {
		cytoscape.use(coseBilkent);
	} catch {
		/* duplicate registration is safe to ignore */
	}
	extensionsRegistered = true;
}

export interface UseCytoscapeInput {
	readonly containerRef?: React.RefObject<HTMLDivElement | null>;
	readonly nodes: readonly GraphNodeView[];
	readonly edges: readonly GraphEdgeView[];
	readonly stylesheet: cytoscape.StylesheetJson;
	readonly layoutName: GraphLayoutName;
	readonly fcoseSettings: FcoseSettings;
	readonly animate: boolean;
	readonly showEdgeLabels: boolean;
	readonly rootId?: string;
	readonly selectedNodeId?: string;
	readonly layoutNonce: number;
	readonly onNodeSelect: (id: string) => void;
	readonly onBackgroundSelect: () => void;
}

export interface CytoscapeController {
	readonly containerRef: React.RefObject<HTMLDivElement | null>;
	readonly ready: boolean;
	readonly layoutPending: boolean;
	readonly layoutDurationMs: number | null;
	readonly fit: () => void;
	readonly zoomTo: (id: string) => void;
	readonly runLayout: () => void;
	readonly resetView: () => void;
}

const DEFAULT_FIT_PADDING = 44;
const COMPACT_FIT_PADDING = 16;
const COMPACT_CANVAS_WIDTH = 480;
const SELECTION_ZOOM = 1.2;
const SMALL_GRAPH_MAX_FIT_ZOOM = 1.25;

/**
 * Owns the Cytoscape instance lifecycle. Elements are diffed by stable id so a
 * selection, filter, or search change never recreates the instance, and an
 * expansion keeps the positions of nodes that were already on screen.
 */
export function useCytoscape(input: UseCytoscapeInput): CytoscapeController {
	const {
		nodes,
		edges,
		stylesheet,
		layoutName,
		fcoseSettings,
		animate,
		showEdgeLabels,
		rootId,
		selectedNodeId,
		layoutNonce,
		onNodeSelect,
		onBackgroundSelect,
	} = input;

	const ownedContainerRef = React.useRef<HTMLDivElement | null>(null);
	const containerRef = input.containerRef ?? ownedContainerRef;
	const cyRef = React.useRef<cytoscape.Core | null>(null);
	const [ready, setReady] = React.useState(false);
	const [layoutPending, setLayoutPending] = React.useState(false);
	const [layoutDurationMs, setLayoutDurationMs] = React.useState<number | null>(
		null,
	);
	const layoutRunIdRef = React.useRef(0);
	const denseLabelsHiddenRef = React.useRef(false);
	const syncGraphLabelsRef = React.useRef<() => void>(() => undefined);

	const initialStylesheet = React.useRef(stylesheet);
	initialStylesheet.current = stylesheet;
	const callbacksRef = React.useRef({ onNodeSelect, onBackgroundSelect });
	callbacksRef.current = { onNodeSelect, onBackgroundSelect };
	const selectedRef = React.useRef<string | undefined>(selectedNodeId);
	selectedRef.current = selectedNodeId;
	const showEdgeLabelsRef = React.useRef(showEdgeLabels);
	showEdgeLabelsRef.current = showEdgeLabels;

	// --- instance lifecycle ----------------------------------------------------
	React.useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		registerExtensions();

		const cy = cytoscape({
			container,
			elements: [],
			style: initialStylesheet.current,
			layout: { name: "grid" },
			userZoomingEnabled: true,
			userPanningEnabled: true,
			boxSelectionEnabled: false,
			autoungrabify: false,
			hideEdgesOnViewport: true,
			textureOnViewport: true,
			motionBlur: false,
			wheelSensitivity: 0.22,
			minZoom: 0.08,
			maxZoom: 4,
		});
		cyRef.current = cy;
		const syncGraphLabels = () => {
			const hideLabels = shouldHideGraphLabels(cy.nodes().length, cy.zoom());
			if (denseLabelsHiddenRef.current === hideLabels) return;
			denseLabelsHiddenRef.current = hideLabels;
			cy.batch(() => cy.nodes().toggleClass("labels-hidden", hideLabels));
		};
		syncGraphLabelsRef.current = syncGraphLabels;
		cy.on("zoom", syncGraphLabels);

		cy.on("tap", "node", (event) => {
			callbacksRef.current.onNodeSelect(event.target.id() as string);
		});
		cy.on("tap", (event) => {
			if (event.target === cy) callbacksRef.current.onBackgroundSelect();
		});

		let hoveredId: string | undefined;
		cy.on("mouseover", "node", (event) => {
			hoveredId = event.target.id() as string;
			applyHighlight(cy, hoveredId);
		});
		cy.on("mouseout", "node", () => {
			hoveredId = undefined;
			applyHighlight(cy, selectedRef.current);
		});

		let previousSize = {
			width: container.clientWidth,
			height: container.clientHeight,
		};
		const resizeObserver =
			typeof ResizeObserver !== "undefined"
				? new ResizeObserver(() => {
						const nextSize = {
							width: container.clientWidth,
							height: container.clientHeight,
						};
						cy.resize();
						if (cy.nodes().length > 0) {
							cy.panBy({
								x: (nextSize.width - previousSize.width) / 2,
								y: (nextSize.height - previousSize.height) / 2,
							});
							const crossedCompactBreakpoint =
								previousSize.width < COMPACT_CANVAS_WIDTH !==
								nextSize.width < COMPACT_CANVAS_WIDTH;
							if (crossedCompactBreakpoint || graphExceedsViewport(cy))
								fitGraphImmediately(cy);
						}
						previousSize = nextSize;
					})
				: null;
		resizeObserver?.observe(container);

		setReady(true);

		return () => {
			resizeObserver?.disconnect();
			cy.off("zoom", syncGraphLabels);
			syncGraphLabelsRef.current = () => undefined;
			denseLabelsHiddenRef.current = false;
			layoutRunIdRef.current += 1;
			setLayoutPending(false);
			setReady(false);
			didRunInitialLayoutRef.current = false;
			cyRef.current = null;
			cy.destroy();
		};
	}, []);

	// --- theme / stylesheet ----------------------------------------------------
	React.useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		cy.style(stylesheet);
	}, [stylesheet]);

	// --- element diff ----------------------------------------------------------
	const topologyRef = React.useRef("");
	React.useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;

		const nodeIds = new Set(nodes.map((node) => node.id));
		const edgeIds = new Set(edges.map((edge) => edge.id));
		const matchById = new Map(
			nodes.map((node) => [node.id, node.matchesQuery] as const),
		);
		const previousTopology = topologyRef.current;
		const addedNodeIds: string[] = [];

		cy.batch(() => {
			for (const edge of cy.edges()) {
				if (!edgeIds.has(edge.id())) edge.remove();
			}
			for (const node of cy.nodes()) {
				if (!nodeIds.has(node.id())) node.remove();
			}

			for (const node of nodes) {
				const existing = cy.getElementById(node.id);
				if (existing.length === 0) {
					cy.add({
						group: "nodes",
						data: {
							id: node.id,
							label: node.label,
							kind: node.kind,
							evidence: node.evidence,
							root: node.root,
							depth: node.depth,
							match: node.matchesQuery,
							ariaLabel: node.ariaLabel,
						},
					});
					addedNodeIds.push(node.id);
					continue;
				}
				existing.data("label", node.label);
				existing.data("kind", node.kind);
				existing.data("evidence", node.evidence);
				existing.data("root", node.root);
				existing.data("depth", node.depth);
				existing.data("match", node.matchesQuery);
				existing.data("ariaLabel", node.ariaLabel);
			}

			for (const edge of edges) {
				if (
					cy.getElementById(edge.source).length === 0 ||
					cy.getElementById(edge.target).length === 0
				) {
					continue;
				}
				const match =
					(matchById.get(edge.source) ?? true) ||
					(matchById.get(edge.target) ?? true);
				const existing = cy.getElementById(edge.id);
				if (existing.length === 0) {
					cy.add({
						group: "edges",
						data: {
							id: edge.id,
							source: edge.source,
							target: edge.target,
							kind: edge.kind,
							evidence: edge.evidence,
							relationshipLabel: edge.relationshipLabel,
							match,
							ariaLabel: edge.ariaLabel,
						},
					});
					if (showEdgeLabelsRef.current) {
						cy.getElementById(edge.id).addClass("show-labels");
					}
					continue;
				}
				existing.data("kind", edge.kind);
				existing.data("evidence", edge.evidence);
				existing.data("relationshipLabel", edge.relationshipLabel);
				existing.data("match", match);
				existing.data("ariaLabel", edge.ariaLabel);
			}

			if (addedNodeIds.length > 0 && previousTopology !== "") {
				seedAddedNodes(cy, addedNodeIds, edges);
			}

			applyHighlight(cy, selectedRef.current);
			if (showEdgeLabelsRef.current) cy.edges().addClass("show-labels");
		});
		syncGraphLabelsRef.current();

		topologyRef.current = [...nodeIds].sort().join("|");
	}, [nodes, edges]);

	// --- selection highlight (no layout, no rebuild) ---------------------------
	React.useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		applyHighlight(cy, selectedNodeId);
	}, [selectedNodeId]);

	React.useEffect(() => {
		const cy = cyRef.current;
		if (!cy) return;
		cy.edges().toggleClass("show-labels", showEdgeLabels);
	}, [showEdgeLabels]);

	// --- layout ----------------------------------------------------------------
	const layoutConfigKey = `${layoutName}|${JSON.stringify(fcoseSettings)}|${layoutNonce}`;
	const layoutConfigRef = React.useRef(layoutConfigKey);
	const rootRef = React.useRef<string | undefined>(rootId);
	const didRunInitialLayoutRef = React.useRef(false);

	const depthById = React.useMemo(() => {
		const map = new Map<string, number>();
		for (const node of nodes) map.set(node.id, node.depth);
		return (id: string) => map.get(id) ?? 1;
	}, [nodes]);

	const runLayout = React.useCallback(
		(fitAfter: boolean) => {
			const cy = cyRef.current;
			if (!cy || cy.nodes().length === 0) return;
			const runId = ++layoutRunIdRef.current;
			const startedAt = performance.now();
			setLayoutPending(true);
			setLayoutDurationMs(null);
			const layout = cy.layout(
				buildLayoutOptions({
					name: layoutName,
					settings: fcoseSettings,
					animate,
					nodeCount: nodes.length,
					fit: false,
					padding: getFitPadding(cy),
					...(rootId ? { rootId } : {}),
					depthById,
				}),
			);
			layout.one("layoutstop", () => {
				if (runId !== layoutRunIdRef.current || cyRef.current !== cy) return;
				const durationMs = performance.now() - startedAt;
				const finish = () => {
					if (runId !== layoutRunIdRef.current || cyRef.current !== cy) return;
					setLayoutDurationMs(durationMs);
					setLayoutPending(false);
				};
				if (fitAfter) {
					void fitGraphToViewport(cy, animate ? 240 : 0).then(finish);
					return;
				}
				finish();
			});
			layout.run();
		},
		[layoutName, fcoseSettings, animate, nodes.length, rootId, depthById],
	);

	React.useEffect(() => {
		const cy = cyRef.current;
		if (!cy || nodes.length === 0) return;
		const rootChanged = rootRef.current !== rootId;
		const configChanged = layoutConfigRef.current !== layoutConfigKey;
		rootRef.current = rootId;
		layoutConfigRef.current = layoutConfigKey;

		if (!didRunInitialLayoutRef.current) {
			didRunInitialLayoutRef.current = true;
			runLayout(true);
			return;
		}
		if (rootChanged || configChanged) {
			runLayout(true);
		}
	}, [layoutConfigKey, rootId, runLayout]);

	// --- imperative actions ----------------------------------------------------
	const fit = React.useCallback(() => {
		const cy = cyRef.current;
		if (!cy) return;
		const elements = cy.elements();
		if (elements.length === 0) return;
		fitGraphToViewport(cy, 220);
	}, []);

	const zoomTo = React.useCallback((id: string) => {
		const cy = cyRef.current;
		if (!cy) return;
		const node = cy.getElementById(id);
		if (node.length === 0) return;
		cy.animate(
			{
				center: { eles: node },
				zoom: Math.max(cy.zoom(), SELECTION_ZOOM),
			},
			{ duration: 240, easing: "ease-out" },
		);
	}, []);

	const resetView = React.useCallback(() => {
		fit();
	}, [fit]);

	const runLayoutNow = React.useCallback(() => {
		runLayout(true);
	}, [runLayout]);

	return {
		containerRef,
		ready,
		layoutPending,
		layoutDurationMs,
		fit,
		zoomTo,
		runLayout: runLayoutNow,
		resetView,
	};
}

function fitGraphToViewport(
	cy: cytoscape.Core,
	duration: number,
): Promise<void> {
	const elements = cy.elements();
	if (elements.length === 0) return Promise.resolve();

	if (cy.nodes().length <= 3) {
		fitGraphImmediately(cy);
		return Promise.resolve();
	}
	if (duration <= 0) {
		fitGraphImmediately(cy);
		return Promise.resolve();
	}

	return cy
		.animation({
			fit: { eles: elements, padding: getFitPadding(cy) },
			duration,
			easing: "ease-out",
		})
		.play()
		.promise("complete")
		.then(() => undefined);
}

function fitGraphImmediately(cy: cytoscape.Core): void {
	const elements = cy.elements();
	if (elements.length === 0) return;
	cy.fit(elements, getFitPadding(cy));
	if (cy.nodes().length <= 3 && cy.zoom() > SMALL_GRAPH_MAX_FIT_ZOOM)
		cy.zoom(SMALL_GRAPH_MAX_FIT_ZOOM);
}

function getFitPadding(cy: cytoscape.Core): number {
	return cy.width() < COMPACT_CANVAS_WIDTH
		? COMPACT_FIT_PADDING
		: DEFAULT_FIT_PADDING;
}

function graphExceedsViewport(cy: cytoscape.Core): boolean {
	const bounds = cy.elements().boundingBox({ includeLabels: true });
	const viewport = cy.extent();
	return (
		bounds.x1 < viewport.x1 ||
		bounds.y1 < viewport.y1 ||
		bounds.x2 > viewport.x2 ||
		bounds.y2 > viewport.y2
	);
}

function applyHighlight(cy: cytoscape.Core, nodeId: string | undefined): void {
	cy.batch(() => {
		cy.elements().removeClass("selected neighbor dimmed highlighted");
		if (!nodeId) return;
		const node = cy.getElementById(nodeId);
		if (node.length === 0) return;
		node.addClass("selected");
		const neighborhood = node.closedNeighborhood();
		neighborhood.addClass("neighbor");
		neighborhood.edges().addClass("highlighted");
		cy.elements().not(neighborhood).addClass("dimmed");
	});
}

function seedAddedNodes(
	cy: cytoscape.Core,
	addedNodeIds: readonly string[],
	edges: readonly GraphEdgeView[],
): void {
	const added = new Set(addedNodeIds);
	const existing = cy.nodes().filter((node) => !added.has(node.id()));
	let center = { x: 0, y: 0 };
	if (existing.length > 0) {
		let x = 0;
		let y = 0;
		for (const node of existing) {
			const position = node.position();
			x += position.x;
			y += position.y;
		}
		center = { x: x / existing.length, y: y / existing.length };
	}

	for (const [index, id] of addedNodeIds.entries()) {
		const node = cy.getElementById(id);
		if (node.length === 0) return;
		const edge = edges.find((candidate) => {
			if (candidate.source === id) {
				return !added.has(candidate.target);
			}
			if (candidate.target === id) {
				return !added.has(candidate.source);
			}
			return false;
		});
		const anchorId = edge
			? edge.source === id
				? edge.target
				: edge.source
			: undefined;
		const anchor = anchorId ? cy.getElementById(anchorId).position() : center;
		node.position(seededPosition(index, addedNodeIds.length, anchor, 120));
	}
}
