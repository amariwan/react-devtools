/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReduxPanel from "./ReduxPanel";

afterEach(() => vi.unstubAllGlobals());

describe("ReduxPanel", () => {
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
		const { container } = render(<ReduxPanel registry={registry} />);
		expect(container).toBeTruthy();
	});

	it("explains detected globals when no adapter is registered", () => {
		vi.stubGlobal("__REDUX_STORE__", {});
		render(
			<ReduxPanel registry={{ services: { get: () => undefined } } as never} />,
		);

		expect(screen.getByText("Redux store detected")).toBeTruthy();
		expect(
			screen.queryByRole("combobox", { name: "Store adapter" }),
		).toBeNull();
	});
});
