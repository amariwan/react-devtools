/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebugSessionsSection } from "./debug-sessions-section";

describe("DebugSessionsSection", () => {
	it("renders", () => {
		const { container } = render(
			<DebugSessionsSection
				shared={false}
				sessionCount={0}
				comparison={null}
				onSharedChange={() => undefined}
				onCapture={() => undefined}
				onExport={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
