/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentTreeToolbar } from "./component-tree-toolbar";

describe("ComponentTreeToolbar", () => {
	it("renders", () => {
		const { container } = render(
			<ComponentTreeToolbar
				query=""
				roots={[]}
				activeRootId={null}
				onQueryChange={() => undefined}
				onRootChange={() => undefined}
				onRefresh={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
