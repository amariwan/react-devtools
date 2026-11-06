/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDebugSessions } from "./use-debug-sessions";

describe("use debug sessions", () => {
	it("initializes", () => {
		const store: Record<string, string> = {};
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				getItem: (k: string) => store[k] ?? null,
				setItem: (k: string, v: string) => {
					store[k] = v;
				},
				removeItem: (k: string) => {
					delete store[k];
				},
				clear: () => {},
				key: () => null,
				length: 0,
			},
		});
		const registry = {
			services: { get: () => undefined },
			list: () => [],
		} as never;
		const { result } = renderHook(() => useDebugSessions(registry, []));
		expect(result.current).toBeTruthy();
	});
});
