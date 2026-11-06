/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TanStackQueryPanel from "./TanStackQueryPanel";

afterEach(() => vi.unstubAllGlobals());

describe("TanStackQueryPanel", () => {
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
		const { container } = render(<TanStackQueryPanel registry={registry} />);
		expect(container).toBeTruthy();
	});

	it("explains detected clients when no adapter is registered", () => {
		vi.stubGlobal("__TANSTACK_QUERY_CLIENT__", {});
		render(
			<TanStackQueryPanel
				registry={{ services: { get: () => undefined } } as never}
			/>,
		);

		expect(screen.getByText("QueryClient detected")).toBeTruthy();
		expect(
			screen.queryByRole("combobox", { name: "Store adapter" }),
		).toBeNull();
	});
});
