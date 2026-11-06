"use client";

import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import {
	ChevronRight,
	Code2,
	Moon,
	PanelLeftClose,
	PanelLeftOpen,
	RefreshCw,
	Search,
	Settings2,
	Sun,
	X,
} from "lucide-react";
import * as React from "react";
import { resolveIcon } from "../components/panel-icon";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../components/ui/popover";
import { SidebarTrigger, useSidebar } from "../components/ui/sidebar";
import { cn } from "../lib/utils";

export function PanelRail({
	panels,
	activePanelId,
	settingsOpen,
	scrollable = true,
	connected = true,
	theme = "light",
	onSelect,
	onSettings,
	onSearch,
	onThemeToggle,
	onRefresh,
	onClose,
}: {
	panels: PanelDescriptor[];
	activePanelId: string | null;
	settingsOpen: boolean;
	scrollable?: boolean;
	connected?: boolean;
	theme?: "light" | "dark";
	onSelect: (id: string) => void;
	onSettings: () => void;
	onSearch?: () => void;
	onThemeToggle?: () => void;
	onRefresh?: () => void;
	onClose?: () => void;
}) {
	const { state, toggleSidebar } = useSidebar();
	const expanded = state === "expanded";
	const refs = React.useRef(new Map<string, HTMLButtonElement>());
	const [menuOpen, setMenuOpen] = React.useState(false);
	const closeMenu = () => setMenuOpen(false);
	return (
		<nav
			aria-label="DevTools navigation"
			className={cn(
				"devtools:flex devtools:min-h-0 devtools:flex-1 devtools:flex-col devtools:text-sidebar-foreground",
				"devtools:@max-[520px]/devtools:hidden",
			)}
		>
			<div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-1 devtools:p-1">
				<Popover open={menuOpen} onOpenChange={setMenuOpen}>
					<PopoverTrigger
						type="button"
						aria-label="DevTools menu"
						aria-expanded={expanded}
						className={cn(
							"devtools:relative devtools:flex devtools:h-10 devtools:shrink-0 devtools:items-center devtools:gap-2 devtools:overflow-hidden devtools:rounded-md devtools:border-0 devtools:bg-transparent devtools:px-2 devtools:text-left devtools:text-sidebar-foreground/70 devtools:outline-none devtools:transition-colors devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-sidebar-ring/50",
							expanded ? "devtools:min-w-0 devtools:flex-1" : "devtools:w-10",
						)}
					>
						<Code2
							className="devtools:size-6 devtools:shrink-0 devtools:text-primary"
							aria-hidden
						/>
						{expanded ? (
							<>
								<span className="devtools:min-w-0 devtools:flex-1 devtools:truncate devtools:text-base devtools:font-semibold devtools:tracking-tight devtools:text-sidebar-foreground">
									DevTools
								</span>
								<ChevronRight
									className="devtools:size-4 devtools:shrink-0"
									aria-hidden
								/>
							</>
						) : null}
						<span
							aria-label={connected ? "Connected" : "Disconnected"}
							className={cn(
								"devtools:absolute devtools:bottom-1.5 devtools:right-1.5 devtools:size-2 devtools:rounded-full devtools:ring-2 devtools:ring-sidebar",
								connected ? "devtools:bg-success" : "devtools:bg-warning",
							)}
						/>
					</PopoverTrigger>
					<PopoverContent
						align="start"
						side="right"
						className="devtools:w-64 devtools:p-1.5"
					>
						<div className="devtools:flex devtools:flex-col devtools:gap-0.5">
							<p className="devtools:px-2 devtools:py-1 devtools:text-xs devtools:font-medium devtools:text-muted-foreground">
								DevTools menu
							</p>
							<MenuAction
								icon={theme === "dark" ? Sun : Moon}
								label={theme === "dark" ? "Light" : "Dark"}
								onClick={() => {
									closeMenu();
									onThemeToggle?.();
								}}
							/>
							<MenuAction
								icon={expanded ? PanelLeftClose : PanelLeftOpen}
								label={expanded ? "Minimize Sidebar" : "Expand Sidebar"}
								onClick={() => {
									closeMenu();
									toggleSidebar();
								}}
							/>
							<MenuAction
								icon={Settings2}
								label="Settings"
								onClick={() => {
									closeMenu();
									onSettings();
								}}
							/>
							<MenuAction
								icon={RefreshCw}
								label="Refresh Page"
								onClick={() => {
									closeMenu();
									onRefresh?.();
								}}
							/>
							{onClose ? (
								<MenuAction
									icon={X}
									label="Close DevTools"
									onClick={() => {
										closeMenu();
										onClose();
									}}
								/>
							) : null}
						</div>
					</PopoverContent>
				</Popover>
				{expanded ? <SidebarTrigger className="devtools:ml-auto" /> : null}
			</div>
			<button
				type="button"
				aria-label="Search panels and commands"
				title="Search panels and commands"
				onClick={onSearch}
				className={cn(
					"devtools:mx-1 devtools:flex devtools:h-9 devtools:shrink-0 devtools:items-center devtools:gap-2 devtools:rounded-md devtools:px-2 devtools:text-sidebar-foreground/70 devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-sidebar-ring/50",
					expanded
						? "devtools:justify-start"
						: "devtools:w-10 devtools:justify-center",
				)}
			>
				<Search className="devtools:size-4 devtools:shrink-0" aria-hidden />
				<span
					className={cn("devtools:text-sm", !expanded && "devtools:sr-only")}
				>
					Search
				</span>
			</button>
			<div
				role="tablist"
				aria-label="Panels"
				aria-orientation="vertical"
				className={cn(
					"devtools:flex devtools:min-h-0 devtools:flex-1 devtools:flex-col devtools:gap-0.5 devtools:py-2",
					scrollable
						? "devtools:overflow-y-auto"
						: "devtools:overflow-y-hidden",
					expanded ? "devtools:px-1.5" : "devtools:px-1",
				)}
			>
				{panels.map((panel, index) => {
					const Icon = resolveIcon(panel.icon);
					const active = !settingsOpen && panel.id === activePanelId;
					return (
						<button
							key={panel.id}
							ref={(element) => {
								if (element) refs.current.set(panel.id, element);
								else refs.current.delete(panel.id);
							}}
							id={`devtools-tab-${panel.id}`}
							type="button"
							role="tab"
							title={panel.title}
							aria-label={panel.title}
							aria-selected={active}
							aria-controls="devtools-panel-view"
							tabIndex={
								panel.id === activePanelId || (!activePanelId && index === 0)
									? 0
									: -1
							}
							onClick={() => onSelect(panel.id)}
							onKeyDown={(event) => {
								const next =
									event.key === "ArrowDown"
										? (index + 1) % panels.length
										: event.key === "ArrowUp"
											? (index - 1 + panels.length) % panels.length
											: event.key === "Home"
												? 0
												: event.key === "End"
													? panels.length - 1
													: null;
								if (next === null) return;
								event.preventDefault();
								const target = panels[next];
								if (target) {
									onSelect(target.id);
									refs.current.get(target.id)?.focus();
								}
							}}
							className={cn(
								"devtools-rail-item devtools:flex devtools:h-9 devtools:w-full devtools:shrink-0 devtools:items-center devtools:gap-2 devtools:rounded-md devtools:text-sidebar-foreground/70 devtools:aria-selected:text-primary devtools:transition-colors devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-sidebar-ring/50",
								expanded
									? "devtools:justify-start devtools:px-2"
									: "devtools:justify-center",
								active && "devtools:bg-primary/10 devtools:font-semibold",
							)}
						>
							<Icon className="devtools:size-4 devtools:shrink-0" aria-hidden />
							<span
								className={cn(
									"devtools:min-w-0 devtools:truncate devtools:text-sm",
									!expanded && "devtools:sr-only",
								)}
							>
								{panel.title}
							</span>
						</button>
					);
				})}
			</div>
			<div
				className={cn(
					"devtools:flex devtools:w-full devtools:shrink-0 devtools:flex-col devtools:border-t devtools:border-sidebar-border devtools:p-1",
					expanded ? "devtools:items-stretch" : "devtools:items-center",
				)}
			>
				<button
					type="button"
					aria-label={
						theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
					}
					title={
						theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
					}
					onClick={onThemeToggle}
					className={cn(
						"devtools:flex devtools:h-9 devtools:w-full devtools:shrink-0 devtools:items-center devtools:gap-2 devtools:rounded-md devtools:px-2 devtools:text-sidebar-foreground/70 devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-sidebar-ring/50",
						expanded ? "devtools:justify-start" : "devtools:justify-center",
					)}
				>
					{theme === "dark" ? (
						<Sun className="devtools:size-4" aria-hidden />
					) : (
						<Moon className="devtools:size-4" aria-hidden />
					)}
					<span
						className={cn("devtools:text-sm", !expanded && "devtools:sr-only")}
					>
						{theme === "dark" ? "Light theme" : "Dark theme"}
					</span>
				</button>
				<button
					type="button"
					aria-label="Settings"
					title="Settings"
					aria-pressed={settingsOpen}
					onClick={onSettings}
					className={cn(
						"devtools-rail-item devtools:flex devtools:h-9 devtools:w-full devtools:shrink-0 devtools:items-center devtools:gap-2 devtools:rounded-md devtools:px-2 devtools:text-sidebar-foreground/70 devtools:aria-pressed:text-primary devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:focus-visible:ring-sidebar-ring/50",
						expanded ? "devtools:justify-start" : "devtools:justify-center",
						settingsOpen && "devtools:bg-primary/10 devtools:font-semibold",
					)}
				>
					<Settings2 className="devtools:size-4" aria-hidden />
					<span
						className={cn("devtools:text-sm", !expanded && "devtools:sr-only")}
					>
						Settings
					</span>
				</button>
			</div>
		</nav>
	);
}

function MenuAction({
	icon: Icon,
	label,
	onClick,
}: {
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	label: string;
	onClick?: (() => void) | undefined;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="devtools:flex devtools:min-h-9 devtools:items-center devtools:gap-2 devtools:rounded-sm devtools:border-0 devtools:bg-transparent devtools:px-2 devtools:text-left devtools:text-sm devtools:text-popover-foreground devtools:outline-none devtools:hover:bg-accent devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring/50"
		>
			<Icon className="devtools:size-4 devtools:shrink-0" aria-hidden />
			<span className="devtools:flex-1">{label}</span>
		</button>
	);
}
