export function buildGraphData(snapshot: unknown): unknown {
	if (!snapshot) {
		return {
			status: "unavailable",
			reason: "React runtime unavailable",
			nodeCount: 0,
			edgeCount: 0,
			nodes: [],
			edges: [],
		};
	}
	const snap = snapshot as {
		data?: { tree?: unknown[] };
		status?: unknown;
		reason?: unknown;
	};
	const tree = (snap.data?.tree ?? []) as Array<Record<string, unknown>>;
	const nodes = tree.map((n) => ({
		id: n.id,
		displayName: n.displayName,
		kind: n.kind,
		hasState: n.hasState,
	}));
	const edges: { from: unknown; to: unknown }[] = [];
	for (const n of tree) {
		if (n.parentId) {
			edges.push({ from: n.parentId, to: n.id });
		}
	}
	return {
		status: snap.status,
		...(snap.reason ? { reason: snap.reason } : {}),
		nodeCount: nodes.length,
		edgeCount: edges.length,
		nodes,
		edges,
	};
}
