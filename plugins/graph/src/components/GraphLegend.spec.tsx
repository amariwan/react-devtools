/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolveGraphTheme } from "../lib/graph-styles";
import { GraphLegend } from "./GraphLegend";

describe("GraphLegend", () => {
	it("renders", () => {
		const { container } = render(
			<GraphLegend theme={resolveGraphTheme()} visibleKinds={new Set()} />,
		);
		expect(container).toBeTruthy();
	});
});
