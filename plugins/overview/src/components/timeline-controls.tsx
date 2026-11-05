import { Button, Label, Select, Toolbar } from "@next-devtools/ui";

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
			<Label style={{ fontSize: 12 }}>
				<span style={{ marginRight: 6 }}>Layer</span>
				<Select
					aria-label="Timeline layer filter"
					value={layerFilter}
					onChange={onLayerFilterChange}
					options={[
						{ value: "", label: "All layers" },
						...layers.map((layer) => ({ value: layer, label: layer })),
					]}
				/>
			</Label>
			<Button
				type="button"
				disabled={!available || recording}
				onClick={onStart}
			>
				Start recording
			</Button>
			<Button
				type="button"
				disabled={!available || !recording}
				onClick={onStop}
			>
				Stop recording
			</Button>
			<Button
				type="button"
				disabled={!available || !hasEvents}
				onClick={onClearEvents}
			>
				Clear
			</Button>
			<Button type="button" onClick={() => onCaptureBaseline()}>
				Capture profiler baseline
			</Button>
			{hasBaseline && (
				<Button type="button" onClick={() => onClearBaseline()}>
					Clear baseline
				</Button>
			)}
		</Toolbar>
	);
}
