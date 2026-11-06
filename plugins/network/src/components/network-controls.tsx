import {
	Download,
	IconButton,
	Play,
	SearchField,
	Select,
	Square,
	Toolbar,
	Trash2,
} from "@next-devtools/ui";
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
		<Toolbar className="devtools:flex-col devtools:flex-nowrap devtools:items-stretch devtools:gap-1.5">
			<div
				role="group"
				aria-label="Network capture actions"
				className="devtools:flex devtools:items-center devtools:gap-1"
			>
				<IconButton
					icon={recording ? Square : Play}
					label={recording ? "Stop recording" : "Start recording"}
					variant={recording ? "outline" : "default"}
					size="icon"
					disabled={
						!available || status === "unavailable" || status === "error"
					}
					onClick={onToggleRecording}
				/>
				<IconButton
					icon={Trash2}
					label="Clear captured requests"
					variant="ghost"
					onClick={onClear}
					disabled={entryCount === 0}
				/>
				<IconButton
					icon={Download}
					label="Export JSON"
					variant="outline"
					onClick={onExport}
					disabled={!hasVisibleEntries}
				/>
			</div>
			<div className="devtools:flex devtools:min-w-0 devtools:items-center devtools:gap-1.5">
				<SearchField
					aria-label="Network request search"
					value={query}
					onChange={onQueryChange}
					placeholder="Filter requests by URL…"
					className="devtools:min-w-0 devtools:flex-1"
				/>
				<Select
					aria-label="Network initiator filter"
					value={initiatorFilter}
					onChange={onInitiatorChange}
					options={[
						{ value: "", label: "All types" },
						...initiators.map((value) => ({ value, label: value })),
					]}
					className="devtools:w-28 devtools:shrink-0"
				/>
			</div>
		</Toolbar>
	);
}
