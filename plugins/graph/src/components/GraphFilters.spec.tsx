/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraphFilters } from "./GraphFilters";

describe("GraphFilters", () => {
	it("renders", () => {
		const { container } = render(
			<GraphFilters
				nodeKinds={new Set()}
				onNodeKindsChange={() => undefined}
				edgeKinds={new Set()}
				onEdgeKindsChange={() => undefined}
			/>,
		);
		expect(
			screen.getByRole("button", {
				name: "Node type filters, 0 of 10 enabled",
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("button", {
				name: "Relationship filters, 0 of 5 enabled",
			}),
		).toBeTruthy();
		expect(screen.getByText("0/10")).toBeTruthy();
		expect(screen.getByText("0/5")).toBeTruthy();
	});
});
