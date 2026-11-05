/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentTree } from "./component-tree";

describe("ComponentTree", () => {
	it("renders", () => {
		const { container } = render(
			<ComponentTree
				tree={[]}
				roots={[]}
				activeRootId={null}
				selectedId={null}
				onRootChange={() => undefined}
				onSelect={() => undefined}
				onRefresh={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
