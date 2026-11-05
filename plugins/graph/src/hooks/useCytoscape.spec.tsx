/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCytoscape } from "./useCytoscape";

describe("useCytoscape", () => {
	it("initializes", () => {
		const { result } = renderHook(() =>
			useCytoscape({
				nodes: [],
				edges: [],
				stylesheet: [],
				layoutName: "fcose",
				fcoseSettings: {} as never,
				animate: false,
				showEdgeLabels: false,
				layoutNonce: 0,
				onNodeSelect: () => undefined,
				onBackgroundSelect: () => undefined,
			}),
		);
		expect(result.current).toBeTruthy();
		expect(result.current.containerRef).toBeTruthy();
	});
});
