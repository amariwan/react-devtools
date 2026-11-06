import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { PluginRegistry } from "@next-devtools/core";
import type { RouteRuntimeService } from "@next-devtools/host-next/route-runtime";
import {
	EmptyState,
	PanelHeader,
	SearchField,
	StatusDot,
} from "@next-devtools/ui";
import * as React from "react";
import { RouteRow } from "./components/route-row.js";
import { buildPagesData } from "./pages-data.js";
import { matchesRoutePattern } from "./route-target.js";

export default function PagesPanel({ registry }: { registry: PluginRegistry }) {
	const service = registry.services.get<RouteRuntimeService>(
		RUNTIME_SERVICE_IDS.routes,
	);
	const subscribe = React.useMemo(
		() =>
			(listener: () => void): (() => void) =>
				service?.subscribe(listener) ?? (() => undefined),
		[service],
	);
	const getSnapshot = React.useMemo(
		() => () => service?.getSnapshot() ?? null,
		[service],
	);
	const snapshot = React.useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot,
	);

	const data = React.useMemo(() => buildPagesData(snapshot), [snapshot]);
	const [query, setQuery] = React.useState("");
	const [parameterValues, setParameterValues] = React.useState<
		Record<string, Record<string, string>>
	>({});
	const visiblePages = React.useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) return data.pages;
		return data.pages.filter((page) =>
			`${page.urlPattern} ${page.fileRoles.join(" ")}`
				.toLowerCase()
				.includes(normalized),
		);
	}, [data.pages, query]);

	const navigateToPage = (target: string) => {
		if (typeof window === "undefined") return;
		window.history.pushState({}, "", target);
	};

	return (
		<div className="devtools:flex devtools:flex-col devtools:gap-3">
			<PanelHeader
				title="Pages / Router"
				description={`${data.segmentCount} segments · ${data.pageCount} pages`}
				actions={<StatusDot status={data.status} />}
			/>
			<div className="devtools:break-all devtools:text-xs devtools:text-muted-foreground">
				Current route{" "}
				<code className="devtools:text-foreground">{data.activePathname}</code>
			</div>
			<SearchField
				value={query}
				onChange={setQuery}
				placeholder="Search routes…"
				aria-label="Route search"
			/>
			{data.pages.length === 0 ? (
				<EmptyState
					title="No routes discovered"
					description={
						data.reason ??
						"Route data is unavailable. Ensure withNextDevtools() is configured."
					}
				/>
			) : visiblePages.length === 0 ? (
				<EmptyState
					title="No matching routes"
					description="Change the route search to see discovered pages."
				/>
			) : (
				<ul className="devtools:m-0 devtools:flex devtools:list-none devtools:flex-col devtools:gap-1 devtools:p-0">
					{visiblePages.map((page) => (
						<RouteRow
							key={page.id}
							page={page}
							values={parameterValues[page.id] ?? {}}
							active={matchesRoutePattern(page, data.activePathname)}
							onParameterChange={(name, value) =>
								setParameterValues((current) => ({
									...current,
									[page.id]: { ...(current[page.id] ?? {}), [name]: value },
								}))
							}
							onNavigate={navigateToPage}
						/>
					))}
				</ul>
			)}
		</div>
	);
}
