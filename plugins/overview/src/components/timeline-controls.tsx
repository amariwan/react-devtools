import {
	CircleDot,
	IconButton,
	Play,
	Select,
	Square,
	Toolbar,
	Trash2,
} from "@next-devtools/ui";

type TimelineControlsProps = {
	available: boolean;
	onStart: () => void;
	onStop: () => void;
	onClearEvents: () => void;
	recording: boolean;
	hasEvents: boolean;
	layers: readonly string[];
	layerFilter: string;
	hasBaseline: boolean;
	onLayerFilterChange: (value: string) => void;
	onCaptureBaseline: () => void;
	onClearBaseline: () => void;
};

export function TimelineControls({
	available,
	onStart,
	onStop,
	onClearEvents,
	recording,
	hasEvents,
	layers,
	layerFilter,
	hasBaseline,
	onLayerFilterChange,
	onCaptureBaseline,
	onClearBaseline,
}: TimelineControlsProps) {
	return (
		<Toolbar aria-label="Timeline controls">
			<Select
				aria-label="Timeline layer filter"
				value={layerFilter}
				onChange={onLayerFilterChange}
				options={[
					{ value: "", label: "All layers" },
					...layers.map((layer) => ({ value: layer, label: layer })),
				]}
				className="devtools:w-24"
			/>
			<IconButton
				type="button"
				icon={Play}
				label="Start recording"
				disabled={!available || recording}
				onClick={onStart}
			/>
			<IconButton
				type="button"
				icon={Square}
				label="Stop recording"
				variant="outline"
				size="icon-sm"
				disabled={!available || !recording}
				onClick={onStop}
			/>
			<IconButton
				type="button"
				icon={Trash2}
				label="Clear timeline events"
				variant="outline"
				size="icon-sm"
				disabled={!available || !hasEvents}
				onClick={onClearEvents}
			/>
			<IconButton
				type="button"
				icon={CircleDot}
				label="Capture profiler baseline"
				variant="secondary"
				size="icon-sm"
				onClick={onCaptureBaseline}
			/>
			{hasBaseline && (
				<IconButton
					type="button"
					icon={Trash2}
					label="Clear profiler baseline"
					variant="ghost"
					size="icon-sm"
					onClick={onClearBaseline}
				/>
			)}
		</Toolbar>
	);
}
