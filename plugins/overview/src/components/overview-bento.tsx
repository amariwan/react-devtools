// Bento 01 from Blank by Craftwork
// Copyright (c) 2026 Craftwork. Craftwork License, use in your projects, no resale: https://craftwork.design/license#components
// Source: https://github.com/craftwork-design/blank-new (f6d6614), via craftwork.design

import { Button, cn, StatusDot } from "@next-devtools/ui";
import {
	Activity,
	ArrowUpRight,
	Check,
	CircleAlert,
	Code2,
	FileCode2,
	GitBranch,
	Layers3,
	Route,
	Search,
} from "lucide-react";
import * as React from "react";

type PanelLink = { id: string; title: string };
type Service = { id: string; status: string };
type Issue = { title: string; detail: string };
type Diagnostic = { id: string; message: string };

export interface OverviewBentoProps {
	connected: boolean;
	currentPath: string;
	pageCount: number;
	componentCount: number;
	diagnosticCount: number;
	services: readonly Service[];
	issues: readonly Issue[];
	recentDiagnostics: readonly Diagnostic[];
	panels: readonly PanelLink[];
	onNavigate: (id: string) => void;
}

function BentoGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="devtools:grid devtools:grid-cols-1 devtools:gap-3 devtools:@2xl:grid-cols-6">
			{children}
		</div>
	);
}

function BentoCard({
	children,
	span,
	tone = "primary",
	className,
}: {
	children: React.ReactNode;
	span: 2 | 3 | 4;
	tone?: "primary" | "info" | "warning";
	className?: string;
}) {
	return (
		<article
			data-slot="bento-card"
			className={cn(
				"devtools:group/bento devtools:relative devtools:isolate devtools:flex devtools:min-h-76 devtools:min-w-0 devtools:flex-col devtools:overflow-hidden devtools:rounded-xl devtools:border devtools:border-border devtools:bg-card devtools:text-card-foreground devtools:shadow-sm devtools:transition-[box-shadow,border-color] devtools:duration-300 devtools:hover:shadow-md devtools:motion-reduce:transition-none",
				span === 2 && "devtools:@2xl:col-span-2",
				span === 3 && "devtools:@2xl:col-span-3",
				span === 4 && "devtools:@2xl:col-span-4",
				className,
			)}
		>
			<div
				aria-hidden
				className="devtools:pointer-events-none devtools:absolute devtools:inset-x-0 devtools:top-0 devtools:z-0 devtools:h-48 devtools:origin-top devtools:bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklab,var(--bento-tint)_18%,transparent),transparent_72%)] devtools:opacity-75 devtools:transition-[transform,opacity] devtools:duration-700 devtools:group-hover/bento:scale-110 devtools:group-hover/bento:opacity-100 devtools:motion-reduce:transition-none"
				style={{ "--bento-tint": `var(--${tone})` } as React.CSSProperties}
			/>
			<div
				className="devtools:pointer-events-none devtools:absolute devtools:inset-x-1/4 devtools:top-0 devtools:h-px devtools:bg-[linear-gradient(to_right,transparent,var(--primary),transparent)] devtools:opacity-40"
				aria-hidden
			/>
			{children}
		</article>
	);
}

function BentoVisual({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"devtools:relative devtools:z-10 devtools:flex devtools:min-h-44 devtools:flex-1 devtools:items-center devtools:justify-center devtools:overflow-hidden devtools:px-5 devtools:pt-5 devtools:pb-2",
				className,
			)}
		>
			{children}
		</div>
	);
}

function BentoCopy({
	title,
	description,
	action,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="devtools:relative devtools:z-10 devtools:flex devtools:flex-col devtools:gap-1.5 devtools:px-5 devtools:pb-5">
			<h2 className="devtools:text-base devtools:font-semibold devtools:tracking-tight">
				{title}
			</h2>
			<p className="devtools:max-w-md devtools:text-xs devtools:leading-relaxed devtools:text-muted-foreground">
				{description}
			</p>
			{action && <div className="devtools:mt-2">{action}</div>}
		</div>
	);
}

const setupCode = [
	'import { withNextDevtools } from "next-devtools"',
	"",
	"const nextConfig = {",
	"  // your Next.js config",
	"}",
	"",
	"export default withNextDevtools(nextConfig)",
];

export function OverviewBento({
	connected,
	currentPath,
	pageCount,
	componentCount,
	diagnosticCount,
	services,
	issues,
	recentDiagnostics,
	panels,
	onNavigate,
}: OverviewBentoProps) {
	const [query, setQuery] = React.useState("");
	const matchingPanels = panels
		.filter(
			(panel) =>
				panel.id !== "overview" &&
				panel.title.toLowerCase().includes(query.trim().toLowerCase()),
		)
		.slice(0, 4);
	const availableServices = services.filter(
		(service) => service.status === "available",
	).length;
	const issueCount = issues.length;
	const checks = [
		{ label: "Runtime connected", done: connected },
		{
			label: "Route tree available",
			done: services.some(
				(service) =>
					service.id.includes("route") && service.status === "available",
			),
		},
		{ label: "Component tree loaded", done: componentCount > 0 },
		{ label: "No service or plugin issues", done: issueCount === 0 },
	];
	const routesPanel = panels.find((panel) => panel.id === "pages");
	const componentsPanel = panels.find((panel) => panel.id === "components");
	const timelinePanel = panels.find((panel) => panel.id === "timeline");

	return (
		<div className="devtools:@container devtools:w-full devtools:max-w-5xl devtools:px-4 devtools:py-6 devtools:sm:px-6">
			<header className="devtools:mb-7 devtools:flex devtools:flex-wrap devtools:items-end devtools:justify-between devtools:gap-4">
				<div className="devtools:max-w-xl">
					<p className="devtools:mb-2 devtools:text-[11px] devtools:font-semibold devtools:uppercase devtools:tracking-[0.18em] devtools:text-primary">
						Workspace / Overview
					</p>
					<h1 className="devtools:text-2xl devtools:font-semibold devtools:tracking-tight devtools:text-foreground devtools:@2xl:text-3xl">
						Your app, in focus.
					</h1>
					<p className="devtools:mt-2 devtools:text-sm devtools:text-muted-foreground">
						A live view of the route, runtime and tools behind this page.
					</p>
				</div>
				<div className="devtools:rounded-full devtools:border devtools:border-border devtools:bg-card devtools:px-3 devtools:py-1.5">
					<StatusDot
						status={connected ? "available" : "unavailable"}
						label={connected ? "Runtime connected" : "Runtime disconnected"}
					/>
				</div>
			</header>

			<BentoGrid>
				<BentoCard span={2} tone="info">
					<BentoVisual>
						<div className="devtools:w-full devtools:max-w-72 devtools:translate-y-3 devtools:rounded-xl devtools:border devtools:border-border devtools:bg-popover devtools:p-2 devtools:shadow-md devtools:transition-transform devtools:duration-500 devtools:group-hover/bento:translate-y-1 devtools:motion-reduce:transition-none">
							<div className="devtools:flex devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-2 devtools:pb-2 devtools:text-xs devtools:font-medium">
								<Route
									aria-hidden
									className="devtools:size-4 devtools:text-primary"
								/>
								Route explorer{" "}
								<span className="devtools:ml-auto devtools:text-muted-foreground">
									{pageCount} pages
								</span>
							</div>
							<div className="devtools:mt-2 devtools:flex devtools:items-center devtools:gap-2 devtools:rounded-md devtools:bg-accent devtools:px-2.5 devtools:py-2">
								<span className="devtools:size-1.5 devtools:rounded-full devtools:bg-primary" />
								<code
									className="devtools:min-w-0 devtools:truncate devtools:font-mono devtools:text-xs"
									title={currentPath}
								>
									{currentPath}
								</code>
								<ArrowUpRight
									aria-hidden
									className="devtools:ml-auto devtools:size-3.5 devtools:text-muted-foreground"
								/>
							</div>
							<div className="devtools:mt-1.5 devtools:flex devtools:gap-2 devtools:px-2.5 devtools:text-[11px] devtools:text-muted-foreground">
								<GitBranch aria-hidden className="devtools:size-3.5" /> Current
								route · {componentCount} component nodes
							</div>
						</div>
					</BentoVisual>
					<BentoCopy
						title="Every route, one click away"
						description="See where you are and jump into the App Router tree."
						action={
							routesPanel && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => onNavigate(routesPanel.id)}
								>
									Open pages <ArrowUpRight aria-hidden />
								</Button>
							)
						}
					/>
				</BentoCard>

				<BentoCard span={4} tone="primary">
					<BentoVisual className="devtools:items-start devtools:justify-start">
						<div className="devtools:w-full devtools:translate-y-2 devtools:rounded-xl devtools:border devtools:border-border devtools:bg-popover devtools:p-4 devtools:shadow-md devtools:transition-transform devtools:duration-500 devtools:group-hover/bento:translate-y-0 devtools:motion-reduce:transition-none">
							<div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:justify-between devtools:gap-2">
								<span className="devtools:flex devtools:items-center devtools:gap-2 devtools:text-xs devtools:font-medium">
									<Activity
										aria-hidden
										className="devtools:size-4 devtools:text-primary"
									/>
									Runtime pulse
								</span>
								<StatusDot
									status={issueCount === 0 ? "available" : "error"}
									label={
										issueCount === 0
											? "All systems nominal"
											: `${issueCount} issues`
									}
								/>
							</div>
							<div className="devtools:mt-4 devtools:flex devtools:gap-8">
								<div>
									<strong className="devtools:text-3xl devtools:font-semibold devtools:tabular-nums">
										{availableServices}
										<span className="devtools:text-lg devtools:text-muted-foreground">
											/{services.length}
										</span>
									</strong>
									<p className="devtools:text-[11px] devtools:text-muted-foreground">
										services available
									</p>
								</div>
								<div>
									<strong
										data-testid="overview-diagnostic-count"
										className="devtools:text-3xl devtools:font-semibold devtools:tabular-nums"
									>
										{diagnosticCount}
									</strong>
									<p className="devtools:text-[11px] devtools:text-muted-foreground">
										diagnostics captured
									</p>
								</div>
							</div>
							<div className="devtools:mt-4 devtools:flex devtools:gap-1">
								{services.map((service) => (
									<span
										key={service.id}
										title={`${service.id}: ${service.status}`}
										className={cn(
											"devtools:h-1.5 devtools:flex-1 devtools:rounded-full",
											service.status === "available"
												? "devtools:bg-primary"
												: service.status === "partial"
													? "devtools:bg-warning"
													: "devtools:bg-border",
										)}
									/>
								))}
							</div>
						</div>
					</BentoVisual>
					<BentoCopy
						title="The runtime at a glance"
						description={
							issueCount === 0
								? "Live service availability, with diagnostics close at hand."
								: `${issueCount} service or plugin issues need attention.`
						}
						action={
							issueCount > 0 && (
								<details className="devtools:text-xs">
									<summary className="devtools:cursor-pointer devtools:text-primary">
										View issues
									</summary>
									<ul className="devtools:mt-2 devtools:space-y-2">
										{issues.map((issue) => (
											<li key={issue.title}>
												<strong>{issue.title}</strong>
												<p className="devtools:text-muted-foreground">
													{issue.detail}
												</p>
											</li>
										))}
									</ul>
								</details>
							)
						}
					/>
				</BentoCard>

				<BentoCard span={4} tone="info">
					<BentoVisual className="devtools:items-start devtools:justify-start devtools:pb-0">
						<div className="devtools:w-full devtools:translate-y-2 devtools:overflow-hidden devtools:rounded-xl devtools:border devtools:border-border devtools:bg-popover devtools:shadow-md devtools:transition-transform devtools:duration-500 devtools:group-hover/bento:translate-y-0 devtools:motion-reduce:transition-none">
							<div className="devtools:flex devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-3 devtools:py-2">
								<span className="devtools:flex devtools:gap-1" aria-hidden>
									<span className="devtools:size-1.5 devtools:rounded-full devtools:bg-destructive/60" />
									<span className="devtools:size-1.5 devtools:rounded-full devtools:bg-warning/60" />
									<span className="devtools:size-1.5 devtools:rounded-full devtools:bg-success/60" />
								</span>
								<FileCode2
									aria-hidden
									className="devtools:ml-2 devtools:size-3.5 devtools:text-muted-foreground"
								/>
								<span className="devtools:text-[11px] devtools:text-muted-foreground">
									next.config.ts
								</span>
								<span className="devtools:ml-auto devtools:rounded-full devtools:bg-accent devtools:px-2 devtools:font-mono devtools:text-[10px]">
									⌘ F
								</span>
							</div>
							<div className="devtools:py-2 devtools:font-mono devtools:text-[11px] devtools:leading-5">
								{setupCode.map((line, index) => (
									<div
										key={index}
										className={cn(
											"devtools:flex devtools:gap-3 devtools:px-3",
											line.includes("withNextDevtools(nextConfig)") &&
												"devtools:border-l-2 devtools:border-primary devtools:bg-primary/10",
										)}
									>
										<span className="devtools:w-3 devtools:shrink-0 devtools:text-right devtools:text-muted-foreground/60">
											{index + 1}
										</span>
										<span className="devtools:whitespace-pre devtools:text-foreground/80">
											{line || " "}
										</span>
									</div>
								))}
							</div>
						</div>
					</BentoVisual>
					<BentoCopy
						title="Made for your Next.js setup"
						description="A small configuration surface with the full inspector behind it."
					/>
				</BentoCard>

				<BentoCard span={2} tone="warning">
					<BentoVisual>
						<div className="devtools:w-full devtools:max-w-72 devtools:space-y-2">
							{recentDiagnostics.length > 0 ? (
								recentDiagnostics.map((event, index) => (
									<div
										key={event.id}
										className={cn(
											"devtools:flex devtools:items-start devtools:gap-2.5 devtools:rounded-lg devtools:border devtools:border-border devtools:bg-popover devtools:px-3 devtools:py-2 devtools:shadow-sm",
											index === 0 && "devtools:shadow-md",
										)}
									>
										<CircleAlert
											aria-hidden
											className="devtools:mt-0.5 devtools:size-3.5 devtools:shrink-0 devtools:text-warning"
										/>
										<span className="devtools:line-clamp-2 devtools:text-xs">
											{event.message}
										</span>
									</div>
								))
							) : (
								<div className="devtools:rounded-xl devtools:border devtools:border-border devtools:bg-popover devtools:p-4 devtools:shadow-md">
									<div className="devtools:flex devtools:items-center devtools:gap-2 devtools:text-xs devtools:font-medium">
										<Activity
											aria-hidden
											className="devtools:size-4 devtools:text-success"
										/>
										Quiet session
									</div>
									<p className="devtools:mt-3 devtools:text-2xl devtools:font-semibold devtools:tabular-nums">
										00
									</p>
									<p className="devtools:text-[11px] devtools:text-muted-foreground">
										No recent diagnostics
									</p>
								</div>
							)}
						</div>
					</BentoVisual>
					<BentoCopy
						title="Trace the important moments"
						description="Recent runtime events stay visible without leaving your page."
						action={
							timelinePanel && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => onNavigate(timelinePanel.id)}
								>
									Open timeline <ArrowUpRight aria-hidden />
								</Button>
							)
						}
					/>
				</BentoCard>

				<BentoCard span={3} tone="primary">
					<BentoVisual>
						<div className="devtools:w-full devtools:max-w-80 devtools:rounded-xl devtools:border devtools:border-border devtools:bg-popover devtools:p-1 devtools:shadow-md">
							<label className="devtools:flex devtools:h-10 devtools:items-center devtools:gap-2 devtools:px-3">
								<Search
									aria-hidden
									className="devtools:size-4 devtools:text-muted-foreground"
								/>
								<span className="devtools:sr-only">Search panels</span>
								<input
									type="search"
									aria-label="Search panels"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Find a panel…"
									className="devtools:min-w-0 devtools:flex-1 devtools:bg-transparent devtools:text-sm devtools:outline-none"
								/>
								<kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:font-mono devtools:text-[10px] devtools:text-muted-foreground">
									Esc
								</kbd>
							</label>
							<div className="devtools:border-t devtools:border-border devtools:px-1 devtools:py-1">
								<p className="devtools:px-2 devtools:py-1 devtools:text-[10px] devtools:uppercase devtools:tracking-widest devtools:text-muted-foreground">
									Panels
								</p>
								{matchingPanels.length > 0 ? (
									matchingPanels.map((panel, index) => (
										<button
											type="button"
											key={panel.id}
											onClick={() => onNavigate(panel.id)}
											className={cn(
												"devtools:flex devtools:h-8 devtools:w-full devtools:items-center devtools:gap-2 devtools:rounded-md devtools:px-2 devtools:text-left devtools:text-xs devtools:transition-colors devtools:hover:bg-accent devtools:focus-visible:outline-2 devtools:focus-visible:outline-ring",
												index === 0 && "devtools:bg-accent",
											)}
										>
											<Layers3
												aria-hidden
												className="devtools:size-3.5 devtools:text-muted-foreground"
											/>
											<span className="devtools:truncate">{panel.title}</span>
											<ArrowUpRight
												aria-hidden
												className="devtools:ml-auto devtools:size-3 devtools:text-muted-foreground"
											/>
										</button>
									))
								) : (
									<p className="devtools:px-2 devtools:py-2 devtools:text-xs devtools:text-muted-foreground">
										No matching panels.
									</p>
								)}
							</div>
						</div>
					</BentoVisual>
					<BentoCopy
						title="Find your next move"
						description="Search the tools in this workspace and open one instantly."
					/>
				</BentoCard>

				<BentoCard span={3} tone="info">
					<BentoVisual>
						<div className="devtools:w-full devtools:max-w-80 devtools:space-y-2">
							{checks.map((check, index) => (
								<div
									key={check.label}
									className={cn(
										"devtools:flex devtools:h-9 devtools:items-center devtools:gap-2.5 devtools:rounded-lg devtools:border devtools:border-border devtools:bg-popover devtools:px-3 devtools:text-xs devtools:shadow-sm devtools:transition-transform devtools:duration-300 devtools:group-hover/bento:translate-x-0 devtools:motion-reduce:transition-none",
										index % 2 === 0
											? "devtools:translate-x-2"
											: "devtools:-translate-x-1",
									)}
								>
									<span
										className={cn(
											"devtools:flex devtools:size-4 devtools:items-center devtools:justify-center devtools:rounded devtools:border",
											check.done
												? "devtools:border-primary devtools:bg-primary devtools:text-primary-foreground"
												: "devtools:border-border devtools:text-muted-foreground",
										)}
									>
										{check.done && (
											<Check aria-hidden className="devtools:size-3" />
										)}
									</span>
									<span
										className={
											check.done
												? "devtools:text-foreground"
												: "devtools:text-muted-foreground"
										}
									>
										{check.label}
									</span>
								</div>
							))}
						</div>
					</BentoVisual>
					<BentoCopy
						title="Know what is ready"
						description="A clear checklist of the runtime capabilities available right now."
						action={
							componentsPanel && (
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={() => onNavigate(componentsPanel.id)}
								>
									Inspect components <Code2 aria-hidden />
								</Button>
							)
						}
					/>
				</BentoCard>
			</BentoGrid>
		</div>
	);
}
