/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolveGraphTheme } from "../lib/graph-styles";
import { GraphLegend } from "./GraphLegend";

describe("GraphLegend", () => {
	it("lists only node kinds present in the rendered graph", () => {
		render(
			<GraphLegend
				theme={resolveGraphTheme()}
				nodes={[{ kind: "component" }, { kind: "state" }]}
			/>,
		);
		expect(screen.getByText("Component")).toBeTruthy();
		expect(screen.getByText("State")).toBeTruthy();
		expect(screen.queryByText("Prop")).toBeNull();
	});
});
