/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ZustandPanel from "./ZustandPanel";

afterEach(() => vi.unstubAllGlobals());

describe("ZustandPanel", () => {
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
		const { container } = render(<ZustandPanel registry={registry} />);
		expect(container).toBeTruthy();
	});

	it("explains detected globals when no adapter is registered", () => {
		vi.stubGlobal("__ZUSTAND_STORES__", [{ id: "global-store" }]);
		render(
			<ZustandPanel
				registry={{ services: { get: () => undefined } } as never}
			/>,
		);

		expect(screen.getByText("Zustand store detected")).toBeTruthy();
		expect(
			screen.queryByRole("combobox", { name: "Store adapter" }),
		).toBeNull();
	});
});
