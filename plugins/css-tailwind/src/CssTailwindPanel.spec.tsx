/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CssTailwindPanel from "./CssTailwindPanel";

describe("CssTailwindPanel", () => {
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
			events: { on: () => () => undefined, emit: () => undefined },
		} as never;
		const { container } = render(<CssTailwindPanel registry={registry} />);
		expect(container).toBeTruthy();
	});
});
