/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphToolbar } from "./GraphToolbar";

describe("GraphToolbar", () => {
	it("renders", () => {
		const { container } = render(
			<GraphToolbar
				query=""
				onQueryChange={() => undefined}
				layoutName="fcose"
				onLayoutChange={() => undefined}
				depth={2}
				onDepthChange={() => undefined}
				animate={false}
				onAnimateChange={() => undefined}
				showEdgeLabels={false}
				onShowEdgeLabelsChange={() => undefined}
				onFit={() => undefined}
				onReset={() => undefined}
				onRunLayout={() => undefined}
				onFocus={() => undefined}
				onExport={() => undefined}
				onToggleFullscreen={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
