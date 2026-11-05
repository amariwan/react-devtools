/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it } from "vitest";
import { useGraphTheme } from "./useGraphTheme";

describe("useGraphTheme", () => {
	it("returns a theme", () => {
		const ref = { current: null } as React.RefObject<HTMLElement | null>;
		const { result } = renderHook(() => useGraphTheme(ref));
		expect(result.current).toBeTruthy();
	});
});
