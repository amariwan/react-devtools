import type cytoscape from "cytoscape";

export type GraphLayoutName =
	| "fcose"
	| "cose"
	| "cose-bilkent"
	| "concentric"
	| "breadthfirst"
	| "grid";

export interface GraphLayoutDescriptor {
	readonly value: GraphLayoutName;
	readonly label: string;
	readonly description: string;
	/** Force-directed layouts expose the fCoSE tuning panel. */
	readonly forceDirected: boolean;
}

export const GRAPH_LAYOUTS: readonly GraphLayoutDescriptor[] = [
	{
		value: "fcose",
		label: "fCoSE",
		description:
			"Fast compound spring embedder. Best default for dependency neighborhoods.",
		forceDirected: true,
	},
	{
		value: "cose",
		label: "CoSE",
		description: "Classic force-directed layout bundled with Cytoscape.",
		forceDirected: true,
	},
	{
		value: "cose-bilkent",
		label: "CoSE-Bilkent",
		description: "Quality force-directed layout for medium graphs.",
		forceDirected: true,
	},
	{
		value: "concentric",
		label: "Concentric",
		description: "Rings by distance from the selected component.",
		forceDirected: false,
	},
	{
		value: "breadthfirst",
		label: "Breadthfirst",
		description: "Layered layout following edge direction.",
		forceDirected: false,
	},
	{
		value: "grid",
		label: "Grid",
		description: "Deterministic grid. Useful for comparing node identities.",
		forceDirected: false,
	},
];

export type FcoseQuality = "draft" | "default" | "proof";

export interface FcoseSettings {
	readonly quality: FcoseQuality;
	/** Minimum separation between nodes, in layout units. */
	readonly nodeSeparation: number;
	/** Repulsion force between nodes. */
	readonly nodeRepulsion: number;
	/** Target edge length. */
	readonly idealEdgeLength: number;
	/** Elasticity of edges. Higher pulls connected nodes closer. */
	readonly edgeElasticity: number;
	/** Gravity toward the graph center. */
	readonly gravity: number;
	readonly animate: boolean;
	readonly animationDuration: number;
}

export const DEFAULT_FCOSE_SETTINGS: FcoseSettings = {
	quality: "default",
	nodeSeparation: 90,
	nodeRepulsion: 5200,
	idealEdgeLength: 90,
	edgeElasticity: 0.45,
	gravity: 0.35,
	animate: true,
	animationDuration: 550,
};

export interface NumericSettingBounds {
	readonly min: number;
	readonly max: number;
	readonly step: number;
	readonly label: string;
	readonly hint: string;
}

export const FCOSE_BOUNDS: Readonly<
	Record<
		| "nodeSeparation"
		| "nodeRepulsion"
		| "idealEdgeLength"
		| "edgeElasticity"
		| "gravity",
		NumericSettingBounds
	>
> = {
	nodeSeparation: {
		min: 20,
		max: 300,
		step: 5,
		label: "Node separation",
		hint: "Minimum gap between nodes.",
	},
	nodeRepulsion: {
		min: 1000,
		max: 60000,
		step: 500,
		label: "Node repulsion",
		hint: "How strongly nodes push apart.",
	},
	idealEdgeLength: {
		min: 20,
		max: 320,
		step: 5,
		label: "Ideal edge length",
		hint: "Target length for connected nodes.",
	},
	edgeElasticity: {
		min: 0.05,
		max: 1,
		step: 0.05,
		label: "Edge elasticity",
		hint: "How hard edges pull connected nodes together.",
	},
	gravity: {
		min: 0.05,
		max: 2,
		step: 0.05,
		label: "Gravity",
		hint: "Pull toward the graph center.",
	},
};

export const FCOSE_QUALITY_OPTIONS: readonly {
	readonly value: FcoseQuality;
	readonly label: string;
	readonly description: string;
}[] = [
	{
		value: "draft",
		label: "Draft",
		description: "Fastest. Approximate positions for large graphs.",
	},
	{
		value: "default",
		label: "Default",
		description: "Balanced quality and runtime.",
	},
	{
		value: "proof",
		label: "Proof",
		description: "Highest quality, slowest. Recommended below 300 nodes.",
	},
];

const LARGE_GRAPH_THRESHOLD = 260;
const ANIMATION_THRESHOLD = 320;

export function clampFcoseSettings(settings: FcoseSettings): FcoseSettings {
	return {
		...settings,
		nodeSeparation: clamp(
			settings.nodeSeparation,
			FCOSE_BOUNDS.nodeSeparation.min,
			FCOSE_BOUNDS.nodeSeparation.max,
		),
		nodeRepulsion: clamp(
			settings.nodeRepulsion,
			FCOSE_BOUNDS.nodeRepulsion.min,
			FCOSE_BOUNDS.nodeRepulsion.max,
		),
		idealEdgeLength: clamp(
			settings.idealEdgeLength,
			FCOSE_BOUNDS.idealEdgeLength.min,
			FCOSE_BOUNDS.idealEdgeLength.max,
		),
		edgeElasticity: clamp(
			settings.edgeElasticity,
			FCOSE_BOUNDS.edgeElasticity.min,
			FCOSE_BOUNDS.edgeElasticity.max,
		),
		gravity: clamp(
			settings.gravity,
			FCOSE_BOUNDS.gravity.min,
			FCOSE_BOUNDS.gravity.max,
		),
	};
}

export interface FcoseValidationIssue {
	readonly level: "warning" | "error";
	readonly message: string;
}

/**
 * Validates the fCoSE parameter combination. Range errors block the layout;
 * performance warnings are advisory and are surfaced in the settings panel.
 */
export function validateFcoseSettings(
	settings: FcoseSettings,
	nodeCount: number,
): readonly FcoseValidationIssue[] {
	const issues: FcoseValidationIssue[] = [];
	for (const key of Object.keys(FCOSE_BOUNDS) as Array<
		keyof typeof FCOSE_BOUNDS
	>) {
		const bounds = FCOSE_BOUNDS[key];
		const value = settings[key];
		if (!Number.isFinite(value)) {
			issues.push({
				level: "error",
				message: `${bounds.label} must be a finite number.`,
			});
			continue;
		}
		if (value < bounds.min || value > bounds.max) {
			issues.push({
				level: "error",
				message: `${bounds.label} must be between ${bounds.min} and ${bounds.max}.`,
			});
		}
	}
	if (settings.quality === "proof" && nodeCount > LARGE_GRAPH_THRESHOLD) {
		issues.push({
			level: "warning",
			message: `Proof quality is slow above ${LARGE_GRAPH_THRESHOLD} nodes. The layout runs at default quality for this graph.`,
		});
	}
	if (settings.animate && nodeCount > ANIMATION_THRESHOLD) {
		issues.push({
			level: "warning",
			message: `Layout animation is disabled above ${ANIMATION_THRESHOLD} nodes to keep the panel responsive.`,
		});
	}
	return issues;
}

export function hasBlockingFcoseIssues(
	issues: readonly FcoseValidationIssue[],
): boolean {
	return issues.some((issue) => issue.level === "error");
}

export interface BuildLayoutOptionsInput {
	readonly name: GraphLayoutName;
	readonly settings: FcoseSettings;
	readonly animate: boolean;
	readonly nodeCount: number;
	readonly fit?: boolean;
	readonly padding?: number;
	readonly rootId?: string;
	readonly depthById?: (nodeId: string) => number;
}

/**
 * Builds a Cytoscape layout configuration. Extension-specific options are not
 * part of Cytoscape's core typings, so the result is intentionally typed as the
 * core union and narrowed by the extension at runtime.
 */
export function buildLayoutOptions(
	input: BuildLayoutOptionsInput,
): cytoscape.LayoutOptions {
	const effectiveAnimate =
		input.animate && input.nodeCount <= ANIMATION_THRESHOLD;
	const quality: FcoseQuality =
		input.settings.quality === "proof" &&
		input.nodeCount > LARGE_GRAPH_THRESHOLD
			? "default"
			: input.settings.quality;

	const base = {
		fit: input.fit ?? true,
		padding: input.padding ?? 40,
		animate: effectiveAnimate,
		animationDuration: effectiveAnimate ? input.settings.animationDuration : 0,
		animationEasing: "ease-out" as const,
		nodeDimensionsIncludeLabels: true,
	};

	switch (input.name) {
		case "fcose":
			return {
				name: "fcose",
				...base,
				quality,
				randomize: false,
				nodeSeparation: input.settings.nodeSeparation,
				nodeRepulsion: input.settings.nodeRepulsion,
				idealEdgeLength: input.settings.idealEdgeLength,
				edgeElasticity: input.settings.edgeElasticity,
				gravity: input.settings.gravity,
				gravityRange: 3.8,
				numIter: quality === "proof" ? 3500 : quality === "draft" ? 800 : 1800,
				samplingType: true,
				sampleSize: 25,
				packComponents: true,
				uniformNodeDimensions: false,
				tile: true,
				tilingPaddingVertical: 18,
				tilingPaddingHorizontal: 18,
			} as unknown as cytoscape.LayoutOptions;
		case "cose":
			return {
				name: "cose",
				...base,
				idealEdgeLength: input.settings.idealEdgeLength,
				nodeRepulsion: input.settings.nodeRepulsion,
				edgeElasticity: input.settings.edgeElasticity,
				gravity: input.settings.gravity,
				randomize: false,
			} as unknown as cytoscape.LayoutOptions;
		case "cose-bilkent":
			return {
				name: "cose-bilkent",
				...base,
				quality,
				nodeRepulsion: input.settings.nodeRepulsion,
				idealEdgeLength: input.settings.idealEdgeLength,
				edgeElasticity: input.settings.edgeElasticity,
				gravity: input.settings.gravity,
				randomize: false,
				numIter: quality === "proof" ? 3500 : 1800,
				tile: true,
			} as unknown as cytoscape.LayoutOptions;
		case "concentric":
			return {
				name: "concentric",
				...base,
				minNodeSpacing: input.settings.nodeSeparation,
				levelWidth: () => 1,
				concentric: (node: cytoscape.NodeSingular) => {
					if (node.id() === input.rootId) return 100;
					const depth = input.depthById?.(node.id()) ?? 1;
					return Math.max(1, 10 - depth);
				},
			} as unknown as cytoscape.LayoutOptions;
		case "breadthfirst":
			return {
				name: "breadthfirst",
				...base,
				directed: true,
				spacingFactor: 1.2,
				avoidOverlap: true,
				grid: false,
			} as unknown as cytoscape.LayoutOptions;
		default:
			return {
				name: "grid",
				...base,
				avoidOverlap: true,
				condense: false,
				spacingFactor: 1.15,
			} as unknown as cytoscape.LayoutOptions;
	}
}

function clamp(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, value));
}

/** Finds a position for a newly discovered node near its anchor. */
export function seededPosition(
	index: number,
	total: number,
	anchor: { readonly x: number; readonly y: number },
	radius = 110,
): { x: number; y: number } {
	const angle = (index / Math.max(1, total)) * Math.PI * 2;
	return {
		x: anchor.x + Math.cos(angle) * radius,
		y: anchor.y + Math.sin(angle) * radius,
	};
}
