/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphToolbar } from "./GraphToolbar";

describe("GraphToolbar", () => {
	it("renders view options in an accessible popover", () => {
		render(
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
				fullscreen={false}
				onOpenSettings={() => undefined}
				loading={false}
				nodeCount={3}
			/>,
		);
		const viewOptions = screen.getByRole("button", { name: "View options" });
		expect(viewOptions.getAttribute("aria-haspopup")).toBe("dialog");
		fireEvent.click(viewOptions);
		expect(viewOptions.getAttribute("aria-expanded")).toBe("true");
		expect(
			screen.getByRole("group", { name: "Graph view actions" }),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Run graph layout" }),
		).toBeTruthy();
	});
});
