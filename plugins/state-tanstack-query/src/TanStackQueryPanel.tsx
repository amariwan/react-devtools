import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { PluginRegistry } from "@next-devtools/core";
import type { StoreAdapterRegistry } from "@next-devtools/core";
import {
	Badge,
	EmptyState,
	PanelHeader,
	StoreInspector,
} from "@next-devtools/ui";
import * as React from "react";
import { buildTanStackQueryData } from "./tanstack-query-data.js";

export default function TanStackQueryPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const service = registry.services.get<StoreAdapterRegistry>(
		RUNTIME_SERVICE_IDS.stores,
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

	const globalDetected = React.useMemo(() => {
		if (typeof window === "undefined") return false;
		const w = window as unknown as Record<string, unknown>;
		return Boolean(w.__TANSTACK_QUERY_CLIENT__ ?? w.__REACT_QUERY_CLIENT__);
	}, []);

	const data = React.useMemo(
		() => buildTanStackQueryData(snapshot, globalDetected),
		[snapshot, globalDetected],
	);

	return (
		<div className="devtools:flex devtools:min-h-0 devtools:flex-col">
			<PanelHeader
				title="TanStack Query"
				actions={
					<Badge variant="secondary">
						{data.adapters.length}{" "}
						{data.adapters.length === 1 ? "adapter" : "adapters"}
					</Badge>
				}
			/>
			{!data.hasData ? (
				<EmptyState
					title="No TanStack Query adapter connected"
					description="Register a store adapter in your application to inspect live state."
				/>
			) : data.adapters.length === 0 ? (
				<EmptyState
					title="QueryClient detected"
					description="Register a TanStack Query adapter to inspect its cache."
				/>
			) : (
				<div className="devtools:p-3">
					<StoreInspector
						adapters={data.adapters}
						selectedAdapterId={snapshot?.data.selectedAdapterId}
						status={snapshot?.status}
						loading={snapshot?.data.loading}
						reason={snapshot?.reason}
						value={snapshot?.data.value}
						onSelect={async (id) => {
							await service?.select(id);
						}}
						onRefresh={async () => {
							await service?.refresh();
						}}
					/>
				</div>
			)}
		</div>
	);
}
