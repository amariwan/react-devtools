/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { SidebarProvider } from "../components/ui/sidebar";
import { PanelRail } from "./shell-panel-rail";

function renderRail(ui: ReactElement, { open = false }: { open?: boolean } = {}) {
	return render(
		<SidebarProvider contained defaultOpen={open}>
			{ui}
		</SidebarProvider>,
	);
}

describe("PanelRail", () => {
	it("renders", () => {
		const { container } = renderRail(
			<PanelRail
				panels={[]}
				activePanelId={null}
				settingsOpen={false}
				onSelect={() => undefined}
				onSettings={() => undefined}
			/>,
		);
		expect(container.firstChild).toBeTruthy();
	});

	it("keeps icon navigation compact and exposes each panel name", () => {
		renderRail(
			<PanelRail
				panels={[
					{
						id: "components",
						title: "Components",
						icon: "components",
					} as never,
				]}
				activePanelId="components"
				settingsOpen={false}
				onSelect={() => undefined}
				onSettings={() => undefined}
			/>,
		);

		const tab = screen.getByRole("tab", { name: "Components" });
		expect(tab.getAttribute("title")).toBe("Components");
		expect(tab.querySelector("span")?.className).toContain("devtools:sr-only");
		expect(tab.getAttribute("aria-selected")).toBe("true");
		expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
	});

	it("supports the reference-style expanded navigation rail", () => {
		renderRail(
			<PanelRail
				panels={[
					{
						id: "overview",
						title: "Overview",
						icon: "overview",
					} as never,
				]}
				activePanelId="overview"
				settingsOpen={false}
				onSelect={() => undefined}
				onSettings={() => undefined}
			/>,
			{ open: true },
		);

		expect(screen.getByText("Overview")).toBeTruthy();
		expect(screen.getByRole("button", { name: "DevTools menu" })).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Toggle Sidebar" }),
		).toBeTruthy();
	});
});
