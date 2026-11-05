/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
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
		expect(container).toBeTruthy();
	});
});
