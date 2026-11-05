import * as React from "react";
import type { GraphView } from "../lib/graph-model.js";
import { nodeById } from "../lib/graph-transform.js";

export interface GraphSelectionState {
	readonly selectedNodeId: string | null;
	readonly selectedNode: ReturnType<typeof nodeById>;
	readonly selectNode: (id: string) => void;
	readonly clearSelection: () => void;
}

/**
 * Local graph selection only. Selecting a node never calls
 * `service.selectComponent`, so inspecting a dependency cannot silently
 * replace the graph root and create a selection feedback loop.
 */
export function useGraphSelection(
	view: GraphView,
	rootComponentId: string | null,
): GraphSelectionState {
	const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
		null,
	);

	React.useEffect(() => {
		setSelectedNodeId(null);
	}, [rootComponentId]);

	React.useEffect(() => {
		if (!selectedNodeId) return;
		if (view.nodes.some((node) => node.id === selectedNodeId)) return;
		setSelectedNodeId(null);
	}, [view.nodes, selectedNodeId]);

	const selectNode = React.useCallback((id: string) => {
		setSelectedNodeId(id);
	}, []);

	const clearSelection = React.useCallback(() => {
		setSelectedNodeId(null);
	}, []);

	const selectedNode = React.useMemo(
		() => nodeById(view, selectedNodeId ?? undefined),
		[view, selectedNodeId],
	);

	return {
		selectedNodeId,
		selectedNode,
		selectNode,
		clearSelection,
	};
}
