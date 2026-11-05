import { Button, SearchField, Select, Toolbar } from "@next-devtools/ui";
import type { NetworkData } from "../network-data.js";

type NetworkControlsProps = {
	available: boolean;
	recording: boolean;
	status: NetworkData["status"];
	entryCount: number;
	hasVisibleEntries: boolean;
	query: string;
	initiatorFilter: string;
	initiators: readonly string[];
	onToggleRecording: () => void;
	onClear: () => void;
	onExport: () => void;
	onQueryChange: (query: string) => void;
	onInitiatorChange: (initiator: string) => void;
};

export function NetworkControls({
	available,
	recording,
	status,
	entryCount,
	hasVisibleEntries,
	query,
	initiatorFilter,
	initiators,
	onToggleRecording,
	onClear,
	onExport,
	onQueryChange,
	onInitiatorChange,
}: NetworkControlsProps) {
	return (
		<Toolbar className="devtools:flex-wrap devtools:gap-2">
			<Button
				variant={recording ? "outline" : "default"}
				disabled={!available || status === "unavailable" || status === "error"}
				onClick={onToggleRecording}
			>
				{recording ? "Stop recording" : "Start recording"}
			</Button>
			<Button variant="ghost" onClick={onClear} disabled={entryCount === 0}>
				Clear
			</Button>
			<Button
				variant="outline"
				onClick={onExport}
				disabled={!hasVisibleEntries}
			>
				Export JSON
			</Button>
			<SearchField
				aria-label="Network request search"
				value={query}
				onChange={onQueryChange}
				placeholder="Filter requests by URL…"
			/>
			<Select
				aria-label="Network initiator filter"
				value={initiatorFilter}
				onChange={onInitiatorChange}
				options={[
					{ value: "", label: "All types" },
					...initiators.map((value) => ({ value, label: value })),
				]}
			/>
		</Toolbar>
	);
}
