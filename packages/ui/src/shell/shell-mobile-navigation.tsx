"use client";

import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import { Moon, Search, Settings2, Sun } from "lucide-react";
import { resolveIcon } from "../components/panel-icon.js";
import { Select } from "../components/ui/select.js";

export function ShellMobileNavigation({
	panels,
	activePanelId,
	settingsOpen,
	onSelect,
	onSettings,
	onSearch,
	theme = "light",
	onThemeToggle,
}: {
	panels: PanelDescriptor[];
	activePanelId: string | null;
	settingsOpen: boolean;
	onSelect: (id: string) => void;
	onSettings: () => void;
	onSearch?: () => void;
	theme?: "light" | "dark";
	onThemeToggle?: () => void;
}) {
	const activePanel = panels.find((panel) => panel.id === activePanelId);
	const Icon =
		activePanel && !settingsOpen ? resolveIcon(activePanel.icon) : Settings2;

	return (
		<div className="devtools:hidden devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-2 devtools:py-1.5 devtools:@max-[520px]/devtools:flex">
			<Icon
				aria-hidden
				className="devtools:size-4 devtools:shrink-0 devtools:text-muted-foreground"
			/>
			<Select
				value={settingsOpen ? "settings" : (activePanelId ?? "")}
				label="DevTools panel"
				onChange={(id) => {
					if (id === "settings") onSettings();
					else onSelect(id);
				}}
				options={[
					...panels.map((panel) => ({
						value: panel.id,
						label: panel.title,
					})),
					{ value: "settings", label: "Settings" },
				]}
				className="devtools:min-w-0 devtools:flex-1"
			/>
			<button
				type="button"
				aria-label="Search panels and commands"
				title="Search panels and commands"
				onClick={onSearch}
				className="devtools:flex devtools:size-8 devtools:shrink-0 devtools:items-center devtools:justify-center devtools:rounded-md devtools:border devtools:border-input devtools:text-muted-foreground devtools:hover:bg-accent devtools:hover:text-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring/50"
			>
				<Search className="devtools:size-4" aria-hidden />
			</button>
			<button
				type="button"
				aria-label={
					theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
				}
				title={
					theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
				}
				onClick={onThemeToggle}
				className="devtools:flex devtools:size-8 devtools:shrink-0 devtools:items-center devtools:justify-center devtools:rounded-md devtools:border devtools:border-input devtools:text-muted-foreground devtools:hover:bg-accent devtools:hover:text-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring/50"
			>
				{theme === "dark" ? (
					<Sun className="devtools:size-4" aria-hidden />
				) : (
					<Moon className="devtools:size-4" aria-hidden />
				)}
			</button>
		</div>
	);
}
