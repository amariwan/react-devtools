/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "./shell-settings";

describe("SettingsView", () => {
	it("renders", () => {
		const prefs = {
			theme: "system",
			dock: "bottom",
			scrollableSidebar: true,
			uiScale: 1,
			hiddenPanels: [],
			hiddenPanelCategories: [],
			pinnedPanels: [],
			highlightUpdates: false,
		} as never;
		const { container } = render(
			<SettingsView
				prefs={prefs}
				panels={[]}
				plugins={[]}
				onThemeChange={() => undefined}
				onDockChange={() => undefined}
				onScaleChange={() => undefined}
				onToggleScrollableSidebar={() => undefined}
				onTogglePanel={() => undefined}
				onActivatePlugin={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Appearance" })).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Tabs" })).toBeTruthy();
		expect(screen.getByText("Scrollable sidebar")).toBeTruthy();
	});

	it("announces optional plugin activation and shows progress on its icon", async () => {
		let finishActivation: (() => void) | undefined;
		const activation = new Promise<void>((resolve) => {
			finishActivation = resolve;
		});
		render(
			<SettingsView
				prefs={
					{
						theme: "system",
						dock: "bottom",
						scrollableSidebar: true,
						uiScale: 1,
						hiddenPanels: [],
						hiddenPanelCategories: [],
						pinnedPanels: [],
						highlightUpdates: false,
					} as never
				}
				panels={[]}
				plugins={
					[
						{
							plugin: {
								manifest: {
									id: "demo",
									displayName: "Demo plugin",
									activation: "on-demand",
								},
							},
							status: "inactive",
						},
					] as never
				}
				onThemeChange={() => undefined}
				onDockChange={() => undefined}
				onScaleChange={() => undefined}
				onTogglePanel={() => undefined}
				onActivatePlugin={vi.fn(() => activation)}
			/>,
		);

		const button = screen.getByRole("button", { name: "Activate Demo plugin" });
		fireEvent.click(button);

		await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"));
		expect(screen.getByRole("status").textContent).toContain(
			"Activating Demo plugin",
		);
		expect(
			button.querySelector("svg")?.classList.contains("devtools:animate-spin"),
		).toBe(true);
		finishActivation?.();
		await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("false"));
	});
});
