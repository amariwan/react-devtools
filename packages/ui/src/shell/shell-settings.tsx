"use client";

import type { PluginRegistry } from "@next-devtools/core";
import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import {
	ArrowDown,
	ArrowUp,
	Check,
	LoaderCircle,
	Pin,
	Play,
	RotateCcw,
} from "lucide-react";
import * as React from "react";
import { resolveIcon } from "../components/panel-icon";
import { PanelHeader, SettingsRow, Switch } from "../components/primitives";
import { Button } from "../components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/ui/dialog";
import { IconButton } from "../components/ui/icon-button";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { createPanelGroups } from "../helpers/panel-catalog";
import {
	type DockPosition,
	type PanelCategory,
	type ShellPrefs,
	type ThemePref,
	UI_SCALE_OPTIONS,
} from "../helpers/prefs";
import { cn } from "../lib/utils";

const DOCK_OPTIONS: SelectOption[] = [
	{ value: "bottom", label: "Bottom" },
	{ value: "right", label: "Right" },
	{ value: "left", label: "Left" },
];

const THEME_OPTIONS: SelectOption[] = [
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

const SCALE_OPTIONS: SelectOption[] = [
	{ value: String(UI_SCALE_OPTIONS[0]), label: "Tiny" },
	{ value: String(UI_SCALE_OPTIONS[1]), label: "Small" },
	{ value: String(UI_SCALE_OPTIONS[2]), label: "Normal" },
	{ value: String(UI_SCALE_OPTIONS[3]), label: "Large" },
	{ value: String(UI_SCALE_OPTIONS[4]), label: "Huge" },
];

export function SettingsView({
	prefs,
	panels,
	plugins,
	onThemeChange,
	onDockChange,
	onDockSizeChange,
	onScaleChange,
	onToggleHighlightUpdates,
	onToggleSidebar,
	onToggleScrollableSidebar,
	onResetSettings,
	onTogglePanel,
	onTogglePanelCategory,
	onTogglePinPanel,
	onMovePinnedPanel,
	onActivatePlugin,
}: {
	prefs: ShellPrefs;
	panels: PanelDescriptor[];
	plugins: ReturnType<PluginRegistry["list"]>;
	onThemeChange: (theme: ThemePref) => void;
	onDockChange: (dock: DockPosition) => void;
	onDockSizeChange?: (size: number) => void;
	onScaleChange: (scale: number) => void;
	onToggleHighlightUpdates?: () => void;
	onToggleSidebar?: () => void;
	onToggleScrollableSidebar?: () => void;
	onResetSettings?: () => void;
	onTogglePanel: (id: string) => void;
	onTogglePanelCategory?: (category: PanelCategory) => void;
	onTogglePinPanel?: (id: string) => void;
	onMovePinnedPanel?: (id: string, delta: number) => void;
	onActivatePlugin: (id: string) => void | Promise<void>;
}) {
	const panelGroups = React.useMemo(
		() => createPanelGroups(panels, prefs),
		[prefs, panels],
	);
	const onDemandPlugins = plugins.filter(
		({ plugin }) => plugin.manifest.activation === "on-demand",
	);
	const [activationError, setActivationError] = React.useState<string | null>(
		null,
	);
	const [activating, setActivating] = React.useState<string | null>(null);
	const [resetOpen, setResetOpen] = React.useState(false);
	return (
		<div className="devtools:min-h-full devtools:min-w-0 devtools:max-w-4xl">
			<PanelHeader
				title="DevTools Settings"
				description="Appearance, navigation, and panel visibility"
			/>
			<div className="devtools:p-4">
				{activationError && (
					<p
						role="alert"
						className="devtools:mb-3 devtools:rounded-md devtools:border devtools:border-destructive/30 devtools:bg-destructive/10 devtools:px-3 devtools:py-2 devtools:text-sm devtools:text-destructive"
					>
						{activationError}
					</p>
				)}
				<div className="devtools:grid devtools:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] devtools:gap-4">
					<SettingsCard
						title="Appearance"
						description="Theme and dock behavior"
						className="devtools:order-2"
					>
						<SettingsRow
							label="Theme"
							description="Light, dark, or follow the system"
						>
							<Select
								value={prefs.theme}
								onChange={(v) => onThemeChange(v as ThemePref)}
								options={THEME_OPTIONS}
								label="Theme"
								className="devtools:w-28"
							/>
						</SettingsRow>
						<SettingsRow
							label="Dock position"
							description="Where DevTools opens"
						>
							<Select
								value={prefs.dock}
								onChange={(v) => onDockChange(v as DockPosition)}
								options={DOCK_OPTIONS}
								label="Dock position"
								className="devtools:w-28"
							/>
						</SettingsRow>
							{onDockSizeChange ? (
								<SettingsRow
									label="Dock size"
									description="Width of the docked panel"
								>
									<input
										type="range"
										min={35}
										max={94}
										step={1}
										value={prefs.dockSize}
										onChange={(event) =>
											onDockSizeChange(Number(event.target.value))
										}
										aria-label="Dock size"
										className="devtools:w-40"
									/>
								</SettingsRow>
							) : null}
						<SettingsRow
							label="UI scale"
							description="Adjust the DevTools density"
						>
							<Select
								value={String(prefs.uiScale)}
								onChange={(value) => onScaleChange(Number(value))}
								options={SCALE_OPTIONS}
								label="UI scale"
								className="devtools:w-28"
							/>
						</SettingsRow>
						{onToggleSidebar ? (
							<SettingsRow
								label="Expand sidebar"
								description="Show panel names beside icons"
							>
								<Switch
									checked={prefs.expandSidebar}
									onCheckedChange={onToggleSidebar}
									label="Expand sidebar"
								/>
							</SettingsRow>
						) : null}
						{onToggleScrollableSidebar ? (
							<SettingsRow
								label="Scrollable sidebar"
								description="Allow the panel list to scroll"
							>
								<Switch
									checked={prefs.scrollableSidebar}
									onCheckedChange={onToggleScrollableSidebar}
									label="Scrollable sidebar"
								/>
							</SettingsRow>
						) : null}
						{onToggleHighlightUpdates ? (
							<SettingsRow
								label="Highlight component updates"
								description="Briefly highlight changed component rows"
							>
								<Switch
									checked={prefs.highlightUpdates}
									onCheckedChange={onToggleHighlightUpdates}
									label="Highlight component updates"
								/>
							</SettingsRow>
						) : null}
					</SettingsCard>

					<SettingsCard
						title="Tabs"
						description="Choose which inspectors appear in navigation"
						className="devtools:order-1"
					>
						{panelGroups
							.filter(({ panels: groupPanels }) => groupPanels.length > 0)
							.map((group) => {
								const category =
									group.name === "pinned" ? undefined : group.name;
								return (
									<div
										key={group.name}
										className={cn(
											"devtools:rounded-md devtools:border devtools:border-border devtools:p-2",
											group.hidden && "devtools:opacity-60 devtools:grayscale",
										)}
									>
										<div className="devtools:flex devtools:items-center devtools:justify-between devtools:gap-3 devtools:pb-1">
											<span className="devtools:capitalize devtools:text-sm devtools:font-medium devtools:text-foreground">
												{group.name}
											</span>
											{!category || !onTogglePanelCategory ? null : (
												<Switch
													checked={!group.hidden}
													onCheckedChange={() =>
														onTogglePanelCategory(category)
													}
													label={`Toggle ${group.name} tabs`}
												/>
											)}
										</div>
										<div className="devtools:divide-y devtools:divide-border">
											{group.panels.map((panel) => {
												const Icon = resolveIcon(panel.icon);
												const pinned = prefs.pinnedPanels.includes(panel.id);
												const pinnedIndex = prefs.pinnedPanels.indexOf(
													panel.id,
												);
												return (
													<div
														key={panel.id}
														className={cn(
															"devtools:flex devtools:items-center devtools:gap-2 devtools:py-1.5",
															prefs.hiddenPanels.includes(panel.id) &&
																"devtools:opacity-40",
														)}
													>
														<span className="devtools:flex devtools:min-w-0 devtools:flex-1 devtools:items-center devtools:gap-2 devtools:text-sm devtools:text-foreground">
															<Icon
																className="devtools:size-4 devtools:shrink-0 devtools:text-muted-foreground"
																aria-hidden
															/>
															<span className="devtools:truncate">
																{panel.title}
															</span>
														</span>
														<div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-0.5">
															{pinned && onMovePinnedPanel ? (
																<>
																	<IconButton
																		icon={ArrowUp}
																		label={`Move ${panel.title} pinned tab up`}
																		iconClassName="devtools:size-3.5"
																		size="icon-xs"
																		disabled={pinnedIndex === 0}
																		onClick={() =>
																			onMovePinnedPanel(panel.id, -1)
																		}
																	/>
																	<IconButton
																		icon={ArrowDown}
																		label={`Move ${panel.title} pinned tab down`}
																		iconClassName="devtools:size-3.5"
																		size="icon-xs"
																		disabled={
																			pinnedIndex ===
																			prefs.pinnedPanels.length - 1
																		}
																		onClick={() =>
																			onMovePinnedPanel(panel.id, 1)
																		}
																	/>
																</>
															) : null}
															{onTogglePinPanel ? (
																<IconButton
																	icon={Pin}
																	label={
																		pinned
																			? `Unpin ${panel.title}`
																			: `Pin ${panel.title}`
																	}
																	iconClassName={cn(
																		"devtools:size-3.5",
																		pinned &&
																			"devtools:fill-current devtools:text-primary",
																	)}
																	size="icon-xs"
																	onClick={() => onTogglePinPanel(panel.id)}
																/>
															) : null}
															<Switch
																checked={!prefs.hiddenPanels.includes(panel.id)}
																onCheckedChange={() => onTogglePanel(panel.id)}
																label={`Show ${panel.title}`}
															/>
														</div>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
					</SettingsCard>

					{onDemandPlugins.length > 0 ? (
						<SettingsCard
							title="Optional plugins"
							description="Activate integrations only when needed"
							className="devtools:col-span-full devtools:order-3"
						>
							{onDemandPlugins.map(({ plugin, status, error }) => (
								<SettingsRow
									key={plugin.manifest.id}
									label={plugin.manifest.displayName}
									description={
										status === "error"
											? (error?.message ?? "Activation failed")
											: "Activate only when needed"
									}
								>
									<IconButton
										icon={
											activating === plugin.manifest.id
												? LoaderCircle
												: status === "active"
													? Check
													: status === "error"
														? RotateCcw
														: Play
										}
										label={
											activating === plugin.manifest.id
												? `Activating ${plugin.manifest.displayName}`
												: status === "active"
													? `${plugin.manifest.displayName} active`
													: status === "error"
														? `Retry ${plugin.manifest.displayName}`
														: `Activate ${plugin.manifest.displayName}`
										}
										{...(activating === plugin.manifest.id
											? {
													iconClassName:
														"devtools:animate-spin devtools:motion-reduce:animate-none",
												}
											: {})}
										type="button"
										aria-busy={activating === plugin.manifest.id}
										onClick={async () => {
											setActivationError(null);
											setActivating(plugin.manifest.id);
											try {
												await onActivatePlugin(plugin.manifest.id);
											} catch (cause) {
												setActivationError(
													cause instanceof Error
														? cause.message
														: "Could not activate plugin. Try again.",
												);
											} finally {
												setActivating(null);
											}
										}}
										disabled={status === "active" || activating !== null}
									/>
									<span role="status" className="devtools:sr-only">
										{activating === plugin.manifest.id
											? `Activating ${plugin.manifest.displayName}`
											: ""}
									</span>
								</SettingsRow>
							))}
						</SettingsCard>
					) : null}
				</div>
				{onResetSettings ? (
					<div className="devtools:mt-4">
						<SettingsCard
							title="Debug"
							description="Clear saved DevTools preferences"
						>
							<Button variant="destructive" onClick={() => setResetOpen(true)}>
								Reset Local Settings & State
							</Button>
						</SettingsCard>
					</div>
				) : null}
			</div>
			{onResetSettings ? (
				<Dialog open={resetOpen} onOpenChange={setResetOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Clear Local Settings & State</DialogTitle>
							<DialogDescription>
								Reset the saved DevTools preferences and return to the default
								layout?
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setResetOpen(false)}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									onResetSettings();
									setResetOpen(false);
								}}
							>
								Reset settings
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</div>
	);
}

function SettingsCard({
	title,
	description,
	className,
	children,
}: {
	title: string;
	description: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<section
			aria-labelledby={`devtools-settings-${title.toLowerCase().replaceAll(" ", "-")}`}
			className={cn(
				"devtools:rounded-lg devtools:border devtools:border-border devtools:bg-card devtools:p-4 devtools:shadow-sm",
				className,
			)}
		>
			<div className="devtools:mb-3">
				<h3
					id={`devtools-settings-${title.toLowerCase().replaceAll(" ", "-")}`}
					className="devtools:text-base devtools:font-medium devtools:text-foreground"
				>
					{title}
				</h3>
				<p className="devtools:mt-0.5 devtools:text-xs devtools:text-muted-foreground">
					{description}
				</p>
			</div>
			<div className="devtools:divide-y devtools:divide-border">{children}</div>
		</section>
	);
}
