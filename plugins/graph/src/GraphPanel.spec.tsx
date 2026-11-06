/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GraphPanel from "./GraphPanel";

vi.mock("./components/GraphCanvas.js", () => ({
	GraphCanvas: () => null,
}));

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
		expect(container.querySelector(".devtools-graph-inspector")).toBeNull();
	});

	it("keeps the selected component label when dependency reading fails", async () => {
		const snapshot = {
			status: "available",
			data: {
				capabilities: { dependencies: true },
				roots: ["root-1"],
				selectedComponentId: "component-1",
				tree: [
					{
						id: "component-1",
						displayName: "Counter",
						kind: "function",
						parentId: null,
						childIds: [],
						hasState: true,
					},
				],
			},
			revision: 1,
		};
		const service = {
			subscribe: () => () => undefined,
			getSnapshot: () => snapshot,
			readDependencies: async () => {
				throw new Error("Dependency read failed");
			},
			subscribeToCommits: () => () => undefined,
		};
		const registry = {
			capabilities: {
				onChange: () => () => undefined,
				list: () => [],
				require: () => undefined,
			},
			services: {
				get: () => service,
				subscribe: () => () => undefined,
			},
			list: () => [],
			panels: { list: () => [], onChange: () => () => undefined },
			commands: { list: () => [] },
			events: {
				on: () => () => undefined,
				emit: () => undefined,
				onChange: () => () => undefined,
			},
		} as never;

		render(<GraphPanel registry={registry} />);
		await waitFor(() => {
			expect(screen.getByText("Dependency extraction failed")).toBeTruthy();
			expect(screen.getByText("Counter · 0 nodes")).toBeTruthy();
		});
	});
});
