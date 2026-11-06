/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it } from "vitest";
import { useGraphTheme } from "./useGraphTheme";

describe("useGraphTheme", () => {
	it("returns a theme", () => {
		const ref = { current: null } as React.RefObject<HTMLElement | null>;
		const { result } = renderHook(() => useGraphTheme(ref));
		expect(result.current).toBeTruthy();
	});

	it("tracks theme changes on its shadow host", async () => {
		const host = document.createElement("div");
		const shadow = host.attachShadow({ mode: "open" });
		const container = document.createElement("div");
		container.style.setProperty("--background", "#0a0a0c");
		container.style.setProperty("--card", "#18181b");
		host.setAttribute("data-theme", "dark");
		shadow.append(container);
		document.body.append(host);
		const ref = { current: container } as React.RefObject<HTMLElement | null>;

		const { result, unmount } = renderHook(() => useGraphTheme(ref));
		await waitFor(() => expect(result.current.isDark).toBe(true));
		expect(result.current.background).toBe("#0a0a0c");

		container.style.setProperty("--background", "#fafafa");
		container.style.setProperty("--card", "#ffffff");
		host.setAttribute("data-theme", "light");
		await waitFor(() => expect(result.current.isDark).toBe(false));
		expect(result.current.background).toBe("#fafafa");
		unmount();
		host.remove();
	});
});
