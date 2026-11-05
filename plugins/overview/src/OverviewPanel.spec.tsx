/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import OverviewPanel from "./OverviewPanel";

describe("OverviewPanel", () => {
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
			onChange: () => () => undefined,
		} as never;
		const { container } = render(<OverviewPanel registry={registry} />);
		expect(container).toBeTruthy();
	});
});
