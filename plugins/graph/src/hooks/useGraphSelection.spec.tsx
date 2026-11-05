/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGraphSelection } from "./useGraphSelection";

describe("useGraphSelection", () => {
	it("selects and clears", () => {
		const view = { nodes: [{ id: "a" }] } as never;
		const { result } = renderHook(() => useGraphSelection(view, "root"));
		act(() => result.current.selectNode("a"));
		expect(result.current.selectedNodeId).toBe("a");
		act(() => result.current.clearSelection());
		expect(result.current.selectedNodeId).toBeNull();
	});

	it("resets on root change", () => {
		const view = { nodes: [{ id: "a" }] } as never;
		const { result, rerender } = renderHook(
			({ root }) => useGraphSelection(view, root),
			{ initialProps: { root: "r1" } },
		);
		act(() => result.current.selectNode("a"));
		rerender({ root: "r2" });
		expect(result.current.selectedNodeId).toBeNull();
	});
});
