/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildGraphView } from "../lib/graph-transform";
import { GraphNodeInspector } from "./GraphNodeInspector";

describe("GraphNodeInspector", () => {
	it("renders", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		const { container } = render(
			<GraphNodeInspector
				view={view}
				selectedNodeId={null}
				onSelectNode={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
