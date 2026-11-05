/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it } from "vitest";
import { resolveGraphTheme } from "../lib/graph-styles";
import { buildGraphView } from "../lib/graph-transform";
import { GraphCanvas } from "./GraphCanvas";

describe("GraphCanvas", () => {
	it("renders", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
		const controller = { containerRef: ref } as never;
		const { container } = render(
			<GraphCanvas
				controller={controller}
				theme={resolveGraphTheme()}
				view={view}
				containerRef={ref}
				onNodeSelect={() => undefined}
				onBackgroundSelect={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
