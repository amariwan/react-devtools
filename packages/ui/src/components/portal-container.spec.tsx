/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDevtoolsPortalContainer } from "./portal-container";

describe("portal container", () => {
	it("returns null outside provider", () => {
		const { result } = renderHook(() => useDevtoolsPortalContainer());
		expect(result.current).toBeNull();
	});
});
