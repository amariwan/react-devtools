/**
 * @vitest-environment jsdom
 */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentTreeItem } from "./component-tree-item";

describe("ComponentTreeItem", () => {
	it("only exposes an expand action for nodes with children", () => {
		const node = {
			id: "a",
			displayName: "A",
			kind: "component",
			childIds: [],
		} as never;
		const props = {
			depth: 0,
			rowIndex: 0,
			selected: false,
			roving: false,
			query: "",
			collapsedIds: new Set<string>(),
			siblingPosition: undefined,
			rows: [],
			onToggle: () => undefined,
			onSelect: async () => undefined,
			onRowFocus: () => undefined,
			onFocusRow: () => undefined,
			registerRef: () => undefined,
		};
		const { container, rerender } = render(
			<ComponentTreeItem node={node} {...props} />,
		);
		expect(container.querySelector("button")).toBeNull();

		rerender(
			<ComponentTreeItem node={{ ...node, childIds: ["child"] }} {...props} />,
		);
		expect(container.querySelector("button")?.getAttribute("aria-label")).toBe(
			"Collapse A",
		);

		rerender(
			<ComponentTreeItem
				node={{ ...node, childIds: ["child"] }}
				{...props}
				query="child"
			/>,
		);
		expect(container.querySelector("button")).toBeNull();
		expect(
			container
				.querySelector('[role="treeitem"]')
				?.getAttribute("aria-expanded"),
		).toBe("true");
	});

	it("moves to a visible child with ArrowRight while filtering", () => {
		const parent = {
			id: "parent",
			displayName: "Parent",
			kind: "component",
			childIds: ["child"],
		} as never;
		const child = {
			id: "child",
			displayName: "Child",
			kind: "component",
			parentId: "parent",
			childIds: [],
		} as never;
		const onToggle = vi.fn();
		const onFocusRow = vi.fn();
		const { getByRole } = render(
			<ComponentTreeItem
				node={parent}
				depth={0}
				rowIndex={0}
				selected={false}
				roving
				query="child"
				collapsedIds={new Set(["parent"])}
				siblingPosition={{ position: 1, size: 1 }}
				rows={[
					{ node: parent, depth: 0 },
					{ node: child, depth: 1 },
				]}
				onToggle={onToggle}
				onSelect={async () => undefined}
				onRowFocus={() => undefined}
				onFocusRow={onFocusRow}
				registerRef={() => undefined}
			/>,
		);

		fireEvent.keyDown(getByRole("treeitem"), { key: "ArrowRight" });

		expect(onToggle).not.toHaveBeenCalled();
		expect(onFocusRow).toHaveBeenCalledWith(1);
	});

	it("marks changed rows for the optional update highlight", () => {
		const node = {
			id: "updated",
			displayName: "Updated",
			kind: "function",
			childIds: [],
		} as never;
		const { getByRole } = render(
			<ComponentTreeItem
				node={node}
				depth={0}
				rowIndex={0}
				selected={false}
				roving
				query=""
				collapsedIds={new Set()}
				siblingPosition={{ position: 1, size: 1 }}
				rows={[{ node, depth: 0 }]}
				highlighted
				onToggle={() => undefined}
				onSelect={async () => undefined}
				onRowFocus={() => undefined}
				onFocusRow={() => undefined}
				registerRef={() => undefined}
			/>,
		);

		const treeitem = getByRole("treeitem");
		expect(treeitem.getAttribute("data-updated")).toBe("true");
		expect(
			treeitem.classList.contains("devtools-component-update-highlight"),
		).toBe(true);
	});
});
