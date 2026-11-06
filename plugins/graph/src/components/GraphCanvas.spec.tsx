/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { resolveGraphTheme } from "../lib/graph-styles";
import { buildGraphView } from "../lib/graph-transform";
import { GraphCanvas } from "./GraphCanvas";

describe("GraphCanvas", () => {
	it("renders", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
		const controller = { containerRef: ref } as never;
		const { container } = render(
			<GraphCanvas
				controller={controller}
				theme={resolveGraphTheme()}
				view={view}
				containerRef={ref}
				selectedNodeId={null}
				onNodeSelect={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});

	it("selects and focuses nodes from the accessible node list", () => {
		const view = buildGraphView({
			rootComponentId: "root",
			sets: new Map([
				[
					"root",
					{
						component: {
							id: "root",
							displayName: "Root",
							kind: "function",
							hasState: false,
						},
						nodes: [
							{
								id: "root",
								kind: "component",
								label: "Root",
								componentId: "root",
								evidence: "observed",
								evidenceSource: "fiber",
							},
						],
						edges: [],
						limitations: [],
						truncated: false,
					},
				],
			]),
			depth: 2,
			nodeKinds: new Set(["component"]),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
		const onNodeSelect = vi.fn();
		const zoomTo = vi.fn();
		const controller = { containerRef: ref, zoomTo } as never;

		const { container } = render(
			<GraphCanvas
				controller={controller}
				theme={resolveGraphTheme()}
				view={view}
				containerRef={ref}
				selectedNodeId={null}
				onNodeSelect={onNodeSelect}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", { name: "Root · Component · Observed" }),
		);
		expect(onNodeSelect).toHaveBeenCalledWith("root");
		expect(zoomTo).toHaveBeenCalledWith("root");
		const details = container.querySelector("details");
		expect(details?.open).toBe(false);
		expect(document.activeElement).toBe(details?.querySelector("summary"));
	});
});
