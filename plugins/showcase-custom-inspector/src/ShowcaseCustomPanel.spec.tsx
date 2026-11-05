/**
 * @vitest-environment jsdom
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ShowcaseCustomPanel from "./ShowcaseCustomPanel";

describe("ShowcaseCustomPanel", () => {
	it("renders", () => {
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
			settings: { get: () => ({ greeting: "Hi" }), set: () => undefined },
		} as never;
		const { container } = render(<ShowcaseCustomPanel registry={registry} />);
		expect(container).toBeTruthy();
	});

	it("updates greeting", () => {
		const set = vi.fn();
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
			settings: { get: () => ({ greeting: "Hi" }), set },
		} as never;
		const { container } = render(<ShowcaseCustomPanel registry={registry} />);
		const input = container.querySelector("input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "Hey" } });
		expect(set).toHaveBeenCalled();
	});
});
