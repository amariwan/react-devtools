/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphStates } from "./GraphStates";

describe("GraphStates", () => {
	it("explains how to start when no component is selected", () => {
		const view = { status: "empty", nodes: [], edges: [] } as never;
		render(
			<GraphStates
				view={view}
				runtimeStatus="available"
				dependenciesCapable
				dependencySetLoaded
				loading={false}
				onReload={() => undefined}
				onResetFilters={() => undefined}
				hiddenByKind={0}
			/>,
		);
		expect(screen.getByText("Select a component")).toBeTruthy();
		expect(
			screen.getByText(
				"Choose one in the Components panel to inspect its dependencies.",
			),
		).toBeTruthy();
	});

	it("keeps an empty dependency result compact beside the graph", () => {
		const view = {
			status: "empty",
			rootComponentId: "root",
			nodes: [],
			edges: [],
		} as never;
		render(
			<GraphStates
				view={view}
				runtimeStatus="available"
				dependenciesCapable
				dependencySetLoaded
				loading={false}
				onReload={() => undefined}
				onResetFilters={() => undefined}
				hiddenByKind={0}
				compact
			/>,
		);
		expect(screen.getByRole("status")).toBeTruthy();
		expect(screen.getByText("No reactive dependencies")).toBeTruthy();
	});
});
