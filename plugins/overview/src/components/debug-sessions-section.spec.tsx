/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DebugSessionsSection } from "./debug-sessions-section";

describe("DebugSessionsSection", () => {
	it("renders", () => {
		const { container, getByRole } = render(
			<DebugSessionsSection
				shared={false}
				sessionCount={0}
				comparison={null}
				onSharedChange={() => undefined}
				onCapture={() => undefined}
				onExport={() => undefined}
				onClear={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
		expect(getByRole("button", { name: "Capture debug session" })).toBeTruthy();
		expect(
			(
				getByRole("button", {
					name: "Export latest session",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
		expect(
			(getByRole("button", { name: "Clear sessions" }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});
});
