// Bento 01 from Blank by Craftwork
// Copyright (c) 2026 Craftwork. Craftwork License, use in your projects, no resale: https://craftwork.design/license#components
// Source: https://github.com/craftwork-design/blank-new (f6d6614), via craftwork.design
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type {
	DiagnosticsRuntime,
	PluginRegistry,
	RuntimeDiagnostic,
} from "@next-devtools/core";
import { Bug, Lightbulb, Map as MapIcon, Settings2, Star } from "lucide-react";
import * as React from "react";
import { KeyboardShortcuts } from "./components/keyboard-shortcuts.js";
import { OverviewBento } from "./components/overview-bento.js";
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

	const panels = registry.panels.list();
	const navigate = (id: string) =>
		window.dispatchEvent(
			new CustomEvent("next-devtools:navigate", { detail: id }),
		);

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
		<>
			<OverviewBento
				connected={connected}
				currentPath={currentPath}
				pageCount={pageCount}
				componentCount={componentCount}
				diagnosticCount={data.health.diagnosticCount}
				services={data.services}
				issues={issues}
				recentDiagnostics={recentDiagnostics}
				panels={panels}
				onNavigate={navigate}
			/>
			<div className="devtools:flex devtools:w-full devtools:max-w-5xl devtools:flex-col devtools:gap-4 devtools:px-4 devtools:pb-6 devtools:sm:px-6">
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
							onClick={() => navigate("settings")}
						/>
					</div>
				</details>
			</div>
		</>
	);
}
