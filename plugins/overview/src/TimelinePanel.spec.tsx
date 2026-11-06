import { createTimelineRuntime } from "@next-devtools/core";
/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TimelinePanel from "./TimelinePanel";

describe("TimelinePanel", () => {
	afterEach(() => vi.useRealTimers());

	it("renders", () => {
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
			capabilities: {
				onChange: () => () => undefined,
				list: () => [],
				require: () => undefined,
			},
			services: { get: () => undefined, subscribe: () => () => undefined },
			list: () => [],
			panels: { list: () => [], onChange: () => () => undefined },
			commands: { list: () => [] },
			events: {
				on: () => () => undefined,
				emit: () => undefined,
				onChange: () => () => undefined,
			},
		} as never;
		const { container } = render(<TimelinePanel registry={registry} />);
		expect(container).toBeTruthy();
	});

	it("refreshes silent events only while recording", () => {
		vi.useFakeTimers();
		const service = createTimelineRuntime();
		const refresh = vi.spyOn(service, "refresh");
		const registry = {
			services: { get: () => service },
		} as never;
		const store: Record<string, string> = {};
		Object.defineProperty(window, "localStorage", {
			configurable: true,
			value: {
				getItem: (key: string) => store[key] ?? null,
				setItem: (key: string, value: string) => {
					store[key] = value;
				},
			},
		});

		render(<TimelinePanel registry={registry} />);
		act(() => vi.advanceTimersByTime(1000));
		expect(refresh).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "Start recording" }));
		act(() => vi.advanceTimersByTime(250));
		expect(refresh).toHaveBeenCalledOnce();
	});
});
