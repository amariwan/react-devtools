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
import { buildReduxData } from "./redux-data.js";

export default function ReduxPanel({ registry }: { registry: PluginRegistry }) {
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

	const hasGlobalStore = React.useMemo(() => {
		if (typeof window === "undefined") return false;
		return Boolean(
			(window as unknown as { __REDUX_STORE__?: unknown }).__REDUX_STORE__,
		);
	}, []);

	const data = React.useMemo(
		() => buildReduxData(snapshot, hasGlobalStore),
		[snapshot, hasGlobalStore],
	);

	return (
		<div className="devtools:flex devtools:min-h-0 devtools:flex-col">
			<PanelHeader
				title="Redux"
				actions={
					<Badge variant="secondary">
						{data.adapters.length}{" "}
						{data.adapters.length === 1 ? "adapter" : "adapters"}
					</Badge>
				}
			/>
			{!data.hasStores ? (
				<EmptyState
					title="No Redux adapter connected"
					description="Register a store adapter in your application to inspect live state."
				/>
			) : data.adapters.length === 0 ? (
				<EmptyState
					title="Redux store detected"
					description="Register the store with a runtime adapter to inspect its state."
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
