import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type {
	DiagnosticsRuntime,
	PluginRegistry,
	RuntimeDiagnostic,
} from "@next-devtools/core";
import { Button, StatusDot } from "@next-devtools/ui";
import { Bug, Lightbulb, Map as MapIcon, Settings2, Star } from "lucide-react";
import * as React from "react";
import { HealthSummary } from "./components/health-summary.js";
import { KeyboardShortcuts } from "./components/keyboard-shortcuts.js";
import { QuickLink } from "./components/quick-link.js";
import { buildOverviewData } from "./overview-data.js";

const REPO_URL = "https://github.com/amariwan/react-devtools";

export default function OverviewPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const [, refresh] = React.useReducer((value) => value + 1, 0);
	React.useEffect(() => {
		const disposers = [
			registry.onChange(refresh),
			registry.panels.onChange(refresh),
			registry.capabilities.onChange(refresh),
			registry.services.subscribe(refresh),
		];
		for (const id of Object.values(RUNTIME_SERVICE_IDS)) {
			const service = registry.services.get<{
				subscribe(listener: () => void): () => void;
			}>(id);
			if (service) disposers.push(service.subscribe(refresh));
		}
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, [registry]);

	const data = buildOverviewData(registry);
	const connected = data.connectionStatus === "connected";

	const reactService = registry.services.get<{
		getSnapshot(): { data: { tree: { length: number } } };
	}>(RUNTIME_SERVICE_IDS.react);
	let componentCount: number;
	try {
		componentCount = reactService?.getSnapshot().data.tree.length ?? 0;
	} catch {
		componentCount = 0;
	}

	const routeService = registry.services.get<{
		getSnapshot(): {
			data: { pathname: string; tree: { nodes: { fileRoles: string[] }[] } };
		};
	}>(RUNTIME_SERVICE_IDS.routes);
	let pageCount: number;
	let currentPath = "/";
	try {
		const routeData = routeService?.getSnapshot().data;
		currentPath = routeData?.pathname ?? "/";
		pageCount =
			routeData?.tree.nodes.filter((node) => node.fileRoles.includes("page"))
				.length ?? 0;
	} catch {
		pageCount = 0;
	}

	const inspectPanel = registry.panels
		.list()
		.find((panel) => panel.id === "components");

	const issues = [
		...data.health.failedPlugins.map((plugin) => ({
			title: `Plugin failed: ${plugin.id}`,
			detail: plugin.message,
		})),
		...data.health.unavailableServices.map((id) => ({
			title: `Service unavailable: ${id}`,
			detail: "Runtime service is not registered.",
		})),
		...data.health.errorServices.map((id) => ({
			title: `Service error: ${id}`,
			detail: "The service could not provide its current snapshot.",
		})),
	];
	let recentDiagnostics: readonly RuntimeDiagnostic[] = [];
	try {
		recentDiagnostics =
			registry.services
				.get<DiagnosticsRuntime>(RUNTIME_SERVICE_IDS.diagnostics)
				?.getSnapshot()
				.data.events.slice(-3)
				.reverse() ?? [];
	} catch {
		// The health summary above reports a failed diagnostics service.
	}

	const isMac =
		typeof navigator !== "undefined" &&
		/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

	return (
		<div className="devtools:flex devtools:w-full devtools:max-w-4xl devtools:flex-col devtools:gap-6 devtools:px-4 devtools:py-6 devtools:sm:px-6">
			<div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:justify-between devtools:gap-2">
				<h1 className="devtools:text-xl devtools:font-semibold devtools:tracking-tight">
					Next.js DevTools
				</h1>
				<StatusDot
					status={connected ? "available" : "unavailable"}
					label={connected ? "Connected" : "Disconnected"}
				/>
			</div>
			<section
				className="devtools:flex devtools:flex-col devtools:items-start devtools:gap-3 devtools:rounded-lg devtools:border devtools:border-border devtools:bg-card devtools:p-4 devtools:shadow-sm"
				aria-labelledby="devtools-current-page"
			>
				<h2
					id="devtools-current-page"
					className="devtools:text-sm devtools:font-semibold devtools:tracking-tight"
				>
					Current page
				</h2>
				<code className="devtools:max-w-full devtools:break-all devtools:rounded-md devtools:bg-muted devtools:px-2.5 devtools:py-1.5 devtools:text-base devtools:font-medium devtools:text-foreground">
					{currentPath}
				</code>
				<p className="devtools:text-xs devtools:text-muted-foreground">
					{pageCount} {pageCount === 1 ? "page" : "pages"} ·{" "}
					{componentCount > 0
						? `${componentCount} component nodes`
						: "Open Components to load the tree"}
				</p>
				{inspectPanel ? (
					<Button
						type="button"
						size="sm"
						onClick={() =>
							window.dispatchEvent(
								new CustomEvent("next-devtools:navigate", {
									detail: inspectPanel.id,
								}),
							)
						}
					>
						Inspect components
					</Button>
				) : null}
			</section>
			<HealthSummary
				issues={issues}
				diagnosticCount={data.health.diagnosticCount}
			/>
			<section
				aria-labelledby="devtools-recent-diagnostics"
				className="devtools:space-y-2"
			>
				<h2
					id="devtools-recent-diagnostics"
					className="devtools:text-sm devtools:font-semibold"
				>
					Recent diagnostics
				</h2>
				{recentDiagnostics.length === 0 ? (
					<p className="devtools:text-xs devtools:text-muted-foreground">
						No runtime errors captured for this page.
					</p>
				) : (
					<ul className="devtools:space-y-2">
						{recentDiagnostics.map((event) => (
							<li
								key={event.id}
								className="devtools:break-words devtools:rounded-md devtools:bg-muted devtools:p-3 devtools:text-xs"
							>
								{event.message}
							</li>
						))}
					</ul>
				)}
			</section>
			<KeyboardShortcuts isMac={isMac} />
			<details className="devtools:text-xs devtools:text-muted-foreground">
				<summary className="devtools:cursor-pointer devtools:font-medium devtools:text-foreground">
					Project links and settings
				</summary>
				<div className="devtools:mt-3 devtools:flex devtools:flex-wrap devtools:gap-x-5 devtools:gap-y-3">
					<QuickLink icon={Star} label="Star on GitHub" href={REPO_URL} />
					<QuickLink
						icon={Lightbulb}
						label="Ideas & Suggestions"
						href={`${REPO_URL}/discussions`}
					/>
					<QuickLink
						icon={MapIcon}
						label="Project Roadmap"
						href={`${REPO_URL}/blob/main/ROADMAP.md`}
					/>
					<QuickLink
						icon={Bug}
						label="Bug Reports"
						href={`${REPO_URL}/issues`}
					/>
					<QuickLink
						icon={Settings2}
						label="Settings"
						onClick={() =>
							window.dispatchEvent(
								new CustomEvent("next-devtools:navigate", {
									detail: "settings",
								}),
							)
						}
					/>
				</div>
			</details>
		</div>
	);
}
