/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GraphPanel from "./GraphPanel";

describe("GraphPanel", () => {
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
		} as never;
		const { container } = render(<GraphPanel registry={registry} />);
		expect(container).toBeTruthy();
	});
});
