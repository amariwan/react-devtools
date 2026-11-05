/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TimelinePanel from "./TimelinePanel";

describe("TimelinePanel", () => {
	it("renders", () => {
		const store: Record<string, string> = {};
		(window as unknown as { localStorage: Storage }).localStorage = {
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
		};
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
});
