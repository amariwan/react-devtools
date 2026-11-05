/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsView } from "./shell-settings";

describe("SettingsView", () => {
	it("renders", () => {
		const prefs = {
			theme: "system",
			dock: "bottom",
			hiddenPanels: [],
		} as never;
		const { container } = render(
			<SettingsView
				prefs={prefs}
				panels={[]}
				plugins={[]}
				onThemeChange={() => undefined}
				onDockChange={() => undefined}
				onTogglePanel={() => undefined}
				onActivatePlugin={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
