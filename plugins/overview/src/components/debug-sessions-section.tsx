import type { compareDebugSessions } from "@next-devtools/core";
import {
	Checkbox,
	CircleDot,
	Download,
	IconButton,
	Label,
	Trash2,
} from "@next-devtools/ui";

type DebugSessionsSectionProps = {
	shared: boolean;
	sessionCount: number;
	comparison: ReturnType<typeof compareDebugSessions> | null;
	onSharedChange: (enabled: boolean) => void;
	onCapture: () => void;
	onExport: () => void;
	onClear: () => void;
};

export function DebugSessionsSection({
	shared,
	sessionCount,
	comparison,
	onSharedChange,
	onCapture,
	onExport,
	onClear,
}: DebugSessionsSectionProps) {
	return (
		<section className="devtools:rounded-md devtools:border devtools:border-border devtools:p-2.5">
			<h3 className="devtools:mb-1.5 devtools:text-sm devtools:font-semibold">
				Debug sessions
			</h3>
			<p className="devtools:mb-2 devtools:text-[11px] devtools:text-muted-foreground">
				Capture bounded, sanitized evidence from the current runtime view and
				compare the two most recent captures.
			</p>
			<div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2">
				<Label className="devtools:flex devtools:items-center devtools:gap-1.5 devtools:text-xs">
					<Checkbox checked={shared} onCheckedChange={onSharedChange} />
					Share across tabs
				</Label>
				<IconButton
					type="button"
					icon={CircleDot}
					label="Capture debug session"
					variant="secondary"
					onClick={onCapture}
				/>
				<IconButton
					type="button"
					icon={Download}
					label="Export latest session"
					variant="outline"
					onClick={onExport}
					disabled={sessionCount === 0}
				/>
				<IconButton
					type="button"
					icon={Trash2}
					label="Clear sessions"
					variant="ghost"
					onClick={onClear}
					disabled={sessionCount === 0}
				/>
			</div>
			<div className="devtools:mt-2 devtools:text-[11px] devtools:text-muted-foreground">
				{sessionCount} debug session{sessionCount === 1 ? "" : "s"} captured
			</div>
			{comparison && (
				<p className="devtools:mt-1.5 devtools:text-[11px]">
					Debug session comparison: {comparison.timelineDelta >= 0 ? "+" : ""}
					{comparison.timelineDelta} timeline events ·{" "}
					{comparison.networkDelta >= 0 ? "+" : ""}
					{comparison.networkDelta} network entries ·{" "}
					{comparison.diagnosticsDelta >= 0 ? "+" : ""}
					{comparison.diagnosticsDelta} diagnostics
				</p>
			)}
		</section>
	);
}
