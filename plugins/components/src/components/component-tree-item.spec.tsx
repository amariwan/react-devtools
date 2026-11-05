/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentTreeItem } from "./component-tree-item";

describe("ComponentTreeItem", () => {
	it("renders", () => {
		const node = {
			id: "a",
			displayName: "A",
			kind: "component",
			childIds: [],
		} as never;
		const { container } = render(
			<ComponentTreeItem
				node={node}
				depth={0}
				rowIndex={0}
				selected={false}
				roving={false}
				query=""
				collapsedIds={new Set()}
				siblingPosition={undefined}
				rows={[]}
				onToggle={() => undefined}
				onSelect={async () => undefined}
				onRowFocus={() => undefined}
				onFocusRow={() => undefined}
				registerRef={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
