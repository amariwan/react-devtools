/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OverviewPanel from "./OverviewPanel";

describe("OverviewPanel", () => {
	it("renders the overview cards and filters available panels", () => {
		const registry = {
			capabilities: {
				onChange: () => () => undefined,
				list: () => [],
				require: () => undefined,
			},
			services: { get: () => undefined, subscribe: () => () => undefined },
			list: () => [],
			panels: {
				list: () => [
					{ id: "components", title: "Components" },
					{ id: "pages", title: "Pages" },
				],
				onChange: () => () => undefined,
			},
			commands: { list: () => [] },
			events: {
				on: () => () => undefined,
				emit: () => undefined,
				onChange: () => () => undefined,
			},
			onChange: () => () => undefined,
		} as never;
		const navigate = vi.fn();
		window.addEventListener("next-devtools:navigate", navigate);
		const { container } = render(<OverviewPanel registry={registry} />);
		expect(container).toBeTruthy();
		expect(
			screen.getByRole("heading", { level: 1, name: "Your app, in focus." }),
		).toBeTruthy();
		for (const name of [
			"Every route, one click away",
			"The runtime at a glance",
			"Made for your Next.js setup",
			"Trace the important moments",
			"Find your next move",
			"Know what is ready",
		]) {
			expect(screen.getByRole("heading", { level: 2, name })).toBeTruthy();
		}
		fireEvent.change(screen.getByRole("searchbox", { name: "Search panels" }), {
			target: { value: "comp" },
		});
		expect(screen.getByRole("button", { name: "Components" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Pages" })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Components" }));
		expect((navigate.mock.calls[0][0] as CustomEvent).detail).toBe(
			"components",
		);
		window.removeEventListener("next-devtools:navigate", navigate);
	});
});
