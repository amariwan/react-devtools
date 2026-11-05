/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComponentsPanel from "./ComponentsPanel";

describe("ComponentsPanel", () => {
	it("renders", () => {
		const registry = {
			capabilities: {
				onChange: () => () => undefined,
				list: () => [],
				require: () => undefined,
			},
			services: { get: () => undefined, subscribe: () => () => undefined },
			list: () => [],
			panels: { list: () => [] },
			commands: { list: () => [] },
			events: { on: () => () => undefined, emit: () => undefined },
		} as never;
		const { container } = render(<ComponentsPanel registry={registry} />);
		expect(container).toBeTruthy();
	});
});
