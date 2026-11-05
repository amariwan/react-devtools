/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_FCOSE_SETTINGS } from "../lib/graph-layout";
import { GraphLayoutSettings } from "./GraphLayoutSettings";

describe("GraphLayoutSettings", () => {
	it("renders closed", () => {
		const { container } = render(
			<GraphLayoutSettings
				open={false}
				onClose={() => undefined}
				settings={DEFAULT_FCOSE_SETTINGS}
				onSettingsChange={() => undefined}
				nodeCount={0}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
