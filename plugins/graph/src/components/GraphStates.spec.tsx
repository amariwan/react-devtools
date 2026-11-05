/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphStates } from "./GraphStates";

describe("GraphStates", () => {
	it("renders", () => {
		const view = { status: "available", nodes: [], edges: [] } as never;
		const { container } = render(
			<GraphStates
				view={view}
				runtimeStatus="available"
				dependenciesCapable={false}
				dependencySetLoaded={false}
				loading={false}
				onReload={() => undefined}
				onResetFilters={() => undefined}
				hiddenByKind={0}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
