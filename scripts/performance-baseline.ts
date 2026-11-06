import { createDiagnosticsRuntime } from "../packages/core/src/diagnostics-runtime.ts";
import { createTimelineStore } from "../packages/core/src/timeline-store.ts";
import type {
	ComponentDependencies,
	DependencyEdge,
	DependencyEdgeKind,
	DependencyNode,
	DependencyNodeKind,
} from "../packages/runtime-react/src/react-bridge.ts";
import {
	FIBER_TAGS,
	type FiberLike,
	buildFiberTree,
} from "../packages/runtime-react/src/react-fiber-adapter.ts";
import { DEFAULT_GRAPH_NODE_LIMIT } from "../plugins/graph/src/lib/graph-model.ts";
import { buildGraphView } from "../plugins/graph/src/lib/graph-transform.ts";

const ITERATIONS = 5;
const FIBER_NODE_BUDGET = 4_000;
const TIMELINE_CAPACITY = 5_000;
const DIAGNOSTICS_CAPACITY = 200;
const GRAPH_INPUT_NODE_COUNT = 10_000;

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function makeFiberTree(depth: number) {
	let nextLeaf = 0;
	function branch(level: number): FiberLike {
		const node: FiberLike = {
			tag: FIBER_TAGS.FunctionComponent,
			type: function BenchComponent() {},
			child: null,
			sibling: null,
		};
		if (level < depth) {
			const left = branch(level + 1);
			const right = branch(level + 1);
			left.sibling = right;
			node.child = left;
		} else {
			node.type = function BenchLeaf() {};
			void nextLeaf++;
		}
		return node;
	}
	return branch(0);
}

function measure(label: string, operation: () => void): number {
	const samples: number[] = [];
	for (let iteration = 0; iteration < ITERATIONS; iteration++) {
		const start = performance.now();
		operation();
		samples.push(performance.now() - start);
	}
	const value = median(samples);
	console.log(`${label}: ${value.toFixed(2)} ms median (${ITERATIONS} runs)`);
	return value;
}

const fiberRoot = makeFiberTree(12);
let fiberCount = 0;
measure("fiber tree build (bounded at 4,000 nodes)", () => {
	let id = 0;
	const built = buildFiberTree(fiberRoot, {
		maxNodes: FIBER_NODE_BUDGET,
		getId: () => `bench-${id++}`,
	});
	fiberCount = built.nodes.length;
});

const timeline = createTimelineStore(TIMELINE_CAPACITY);
measure("timeline emit (10,000 events)", () => {
	for (let index = 0; index < 10_000; index++) {
		timeline.emit({
			layer: "benchmark",
			type: "event",
			timestampUnixMs: index,
			payload: { index },
		});
	}
});

const diagnostics = createDiagnosticsRuntime({
	capacity: DIAGNOSTICS_CAPACITY,
});
measure("diagnostic record (10,000 bounded values)", () => {
	for (let index = 0; index < 10_000; index++) {
		diagnostics.record({ kind: "error", error: `benchmark-${index}` });
	}
});

const graphNodeKinds = new Set<DependencyNodeKind>([
	"component",
	"prop",
	"state",
	"reducer",
	"memo",
	"callback",
	"effect",
	"context",
	"external-store",
	"selector",
]);
const graphEdgeKinds = new Set<DependencyEdgeKind>([
	"reads",
	"consumes",
	"subscribes",
	"depends-on",
	"observed-update",
]);
const graphNodes: DependencyNode[] = [
	{
		id: "graph-root",
		kind: "component",
		label: "GraphRoot",
		componentId: "graph-root",
		evidence: "observed",
		evidenceSource: "performance-baseline",
	},
	...Array.from({ length: GRAPH_INPUT_NODE_COUNT }, (_, index) => ({
		id: `graph-prop-${index}`,
		kind: "prop" as const,
		label: `prop${index}`,
		componentId: "graph-root",
		evidence: "observed" as const,
		evidenceSource: "performance-baseline",
		value: index,
	})),
];
const graphEdges: DependencyEdge[] = graphNodes.slice(1).map((node, index) => ({
	id: `graph-edge-${index}`,
	source: "graph-root",
	target: node.id,
	kind: "reads",
	evidence: "observed",
	evidenceSource: "performance-baseline",
}));
const graphSets = new Map<string, ComponentDependencies>([
	[
		"graph-root",
		{
			component: {
				id: "graph-root",
				displayName: "GraphRoot",
				kind: "function",
				hasState: true,
			},
			nodes: graphNodes,
			edges: graphEdges,
			limitations: [],
			truncated: false,
		},
	],
]);
let graphNodeCount = 0;
let graphTruncated = false;
measure(
	`graph transform (${GRAPH_INPUT_NODE_COUNT} inputs, ${DEFAULT_GRAPH_NODE_LIMIT} node limit)`,
	() => {
		const graph = buildGraphView({
			rootComponentId: "graph-root",
			sets: graphSets,
			depth: 1,
			nodeKinds: graphNodeKinds,
			edgeKinds: graphEdgeKinds,
			query: "",
			nodeLimit: DEFAULT_GRAPH_NODE_LIMIT,
		});
		graphNodeCount = graph.nodeCount;
		graphTruncated = graph.truncated;
	},
);

const diagnosticCount = diagnostics.getSnapshot().data.events.length;
console.log(`fiber nodes retained: ${fiberCount}/${FIBER_NODE_BUDGET}`);
console.log(
	`timeline events retained: ${timeline.size()}/${TIMELINE_CAPACITY}`,
);
console.log(`diagnostics retained: ${diagnosticCount}/${DIAGNOSTICS_CAPACITY}`);
console.log(
	`graph nodes retained: ${graphNodeCount}/${DEFAULT_GRAPH_NODE_LIMIT}`,
);

if (
	fiberCount > FIBER_NODE_BUDGET ||
	timeline.size() > TIMELINE_CAPACITY ||
	diagnosticCount > DIAGNOSTICS_CAPACITY ||
	graphNodeCount > DEFAULT_GRAPH_NODE_LIMIT ||
	!graphTruncated
) {
	throw new Error("Runtime retention exceeded a configured bound");
}

diagnostics.dispose();
