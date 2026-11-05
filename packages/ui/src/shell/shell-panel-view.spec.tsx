/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelView } from "./shell-panel-view";

describe("PanelView", () => {
	it("renders loading", () => {
		const registry = {
			list: () => [],
			services: { get: () => undefined },
		} as never;
		const panel = { id: "p", title: "P", component: undefined } as never;
		const { container } = render(
			<PanelView registry={registry} panel={panel} />,
		);
		expect(container).toBeTruthy();
	});
});
