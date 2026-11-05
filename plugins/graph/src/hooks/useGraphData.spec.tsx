/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGraphData } from "./useGraphData";

describe("useGraphData", () => {
	it("initializes with no service", () => {
		const { result } = renderHook(() =>
			useGraphData({
				service: undefined,
				depth: 2,
				nodeLimit: 10,
				nodeKinds: new Set(),
				edgeKinds: new Set(),
				query: "",
			}),
		);
		expect(result.current).toBeTruthy();
		expect(result.current.view).toBeTruthy();
	});
});
