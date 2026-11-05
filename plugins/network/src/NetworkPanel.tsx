import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { PluginRegistry } from "@next-devtools/core";
import type { NetworkRuntimeService } from "@next-devtools/core";
import {
	Badge,
	Button,
	EmptyState,
	PanelHeader,
	Table,
	TableBody,
	TableHead,
	TableHeader,
	TableRow,
} from "@next-devtools/ui";
import * as React from "react";
import { NetworkControls } from "./components/network-controls.js";
import { NetworkEntryRow } from "./components/network-entry-row.js";
import { buildNetworkData } from "./network-data.js";

export default function NetworkPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const service = registry.services.get<NetworkRuntimeService>(
		RUNTIME_SERVICE_IDS.network,
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

	const data = React.useMemo(() => buildNetworkData(snapshot), [snapshot]);
	const [query, setQuery] = React.useState("");
	const [initiatorFilter, setInitiatorFilter] = React.useState("");
	const [expandedId, setExpandedId] = React.useState<string | null>(null);

	const initiators = React.useMemo(
		() => [...new Set(data.entries.map((entry) => entry.initiatorType))].sort(),
		[data.entries],
	);
	const visibleEntries = React.useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return data.entries.filter((entry) => {
			if (initiatorFilter && entry.initiatorType !== initiatorFilter)
				return false;
			return (
				!normalizedQuery || entry.url.toLowerCase().includes(normalizedQuery)
			);
		});
	}, [data.entries, initiatorFilter, query]);

	const exportEntries = () => {
		if (typeof document === "undefined") return;
		const blob = new Blob([JSON.stringify(visibleEntries, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "next-devtools-network.json";
		anchor.click();
		URL.revokeObjectURL(url);
	};

	const resetFilters = () => {
		setQuery("");
		setInitiatorFilter("");
	};
	return (
		<div className="devtools:flex devtools:min-h-0 devtools:flex-col">
			<PanelHeader
				title="Network"
				description="Resource timing metadata. Full request details remain in browser DevTools."
				actions={
					<Badge variant={data.recording ? "default" : "secondary"}>
						{data.recording ? "Recording" : "Stopped"} · {data.count} requests
					</Badge>
				}
			/>
			<NetworkControls
				available={Boolean(service)}
				recording={data.recording}
				status={data.status}
				entryCount={data.count}
				hasVisibleEntries={visibleEntries.length > 0}
				query={query}
				initiatorFilter={initiatorFilter}
				initiators={initiators}
				onToggleRecording={() =>
					data.recording ? service?.stop() : service?.start()
				}
				onClear={() => service?.clear()}
				onExport={exportEntries}
				onQueryChange={setQuery}
				onInitiatorChange={setInitiatorFilter}
			/>
			{(data.reason || data.dropped > 0) && (
				<output className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:text-muted-foreground">
					{data.reason}
					{data.reason && data.dropped > 0 ? " · " : ""}
					{data.dropped > 0 ? `${data.dropped} older entries dropped` : ""}
				</output>
			)}
			{data.entries.length === 0 ? (
				<EmptyState
					title={
						data.status === "available"
							? "No requests captured"
							: "Network capture unavailable"
					}
					description={
						data.reason ??
						(data.recording
							? "Load a page or trigger a request to capture resource timings."
							: "Start recording, then trigger a request in your application.")
					}
				/>
			) : visibleEntries.length === 0 ? (
				<EmptyState
					title="No matching requests"
					description="Change the URL search or resource type filter."
					action={
						<Button variant="outline" onClick={resetFilters}>
							Reset filters
						</Button>
					}
				/>
			) : (
				<div className="devtools:overflow-auto">
					<Table className="devtools:table-fixed devtools:min-w-[560px]">
						<TableHeader>
							<TableRow>
								<TableHead className="devtools:w-[45%]">Request</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Type</TableHead>
								<TableHead className="devtools:text-right">Duration</TableHead>
								<TableHead className="devtools:text-right">Size</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleEntries.map((entry) => (
								<NetworkEntryRow
									key={entry.id}
									entry={entry}
									expanded={expandedId === entry.id}
									onToggle={() =>
										setExpandedId((current) =>
											current === entry.id ? null : entry.id,
										)
									}
								/>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
