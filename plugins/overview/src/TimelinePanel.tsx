import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import {
	type PluginRegistry,
	type ProfilerInsights,
	buildProfilerInsights,
	compareProfilerInsights,
} from "@next-devtools/core";
import type { TimelineRuntime } from "@next-devtools/core";
import {
	Badge,
	EmptyState,
	IconButton,
	Info,
	PanelHeader,
} from "@next-devtools/ui";
import * as React from "react";
import { DebugSessionsSection } from "./components/debug-sessions-section.js";
import { ProfilerSections } from "./components/profiler-sections.js";
import { TimelineControls } from "./components/timeline-controls.js";
import { TimelineEventList } from "./components/timeline-event-list.js";
import { useDebugSessions } from "./hooks/use-debug-sessions.js";
import { buildTimelineData } from "./timeline-data.js";

export default function TimelinePanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const service = registry.services.get<TimelineRuntime>(
		RUNTIME_SERVICE_IDS.timeline,
	);
	const [, setPollTick] = React.useState(0);
	const subscribe = React.useMemo(
		() => (listener: () => void) =>
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
	const data = React.useMemo(() => buildTimelineData(snapshot), [snapshot]);
	React.useEffect(() => {
		if (!service || !data.recording) return;
		const interval = window.setInterval(() => {
			service.refresh();
			setPollTick((tick) => tick + 1);
		}, 250);
		return () => window.clearInterval(interval);
	}, [service, data.recording]);
	const profiler = React.useMemo(
		() => buildProfilerInsights(data.events),
		[data.events],
	);
	const [baseline, setBaseline] = React.useState<ProfilerInsights | null>(null);
	const comparison = React.useMemo(
		() => (baseline ? compareProfilerInsights(baseline, profiler) : null),
		[baseline, profiler],
	);
	const {
		shareDebugSessions,
		debugSessions,
		debugComparison,
		toggleSharedSessions,
		captureSession,
		exportLatestSession,
		clearSessions,
	} = useDebugSessions(registry, data.events);
	const [layerFilter, setLayerFilter] = React.useState(
		() => snapshot?.data.filter.layers?.[0] ?? "",
	);
	const layers = React.useMemo(() => {
		const names = new Set(service?.listLayers().map((layer) => layer.id) ?? []);
		for (const event of data.events) names.add(event.layer);
		return [...names].sort();
	}, [service, data.events]);

	const updateLayerFilter = (value: string) => {
		setLayerFilter(value);
		service?.setFilter(value ? { layers: [value] } : {});
	};

	return (
		<div className="devtools:flex devtools:flex-col devtools:gap-2">
			<PanelHeader
				title="Timeline"
				actions={
					<>
						<Badge variant="secondary">
							{data.recording ? "Recording" : "Stopped"} · {data.count} events
							{data.dropped ? ` · ${data.dropped} dropped` : ""}
						</Badge>
						<IconButton
							icon={Info}
							label="Runtime events come from registered DevTools layers. React commit profiling is not inferred from this stream."
							size="icon-xs"
						/>
					</>
				}
			/>
			<TimelineControls
				available={Boolean(service)}
				onStart={() => service?.startRecording()}
				onStop={() => service?.stopRecording()}
				onClearEvents={() => service?.clear()}
				recording={data.recording}
				hasEvents={data.events.length > 0}
				layers={layers}
				layerFilter={layerFilter}
				hasBaseline={baseline !== null}
				onLayerFilterChange={updateLayerFilter}
				onCaptureBaseline={() => setBaseline(profiler)}
				onClearBaseline={() => setBaseline(null)}
			/>
			<DebugSessionsSection
				shared={shareDebugSessions}
				sessionCount={debugSessions.length}
				comparison={debugComparison}
				onSharedChange={toggleSharedSessions}
				onCapture={captureSession}
				onExport={exportLatestSession}
				onClear={clearSessions}
			/>
			{data.events.length === 0 ? (
				<EmptyState
					title={
						data.status === "available"
							? "No timeline events"
							: "Timeline unavailable"
					}
					description={
						data.reason ??
						"Events appear when a registered layer emits while recording."
					}
				/>
			) : (
				<>
					<ProfilerSections comparison={comparison} profiler={profiler} />
					<TimelineEventList events={data.events} />
				</>
			)}
		</div>
	);
}
