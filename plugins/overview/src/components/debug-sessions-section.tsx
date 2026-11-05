import type { compareDebugSessions } from "@next-devtools/core";
import { Button, Checkbox, Label } from "@next-devtools/ui";

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
		<section
			style={{
				border: "1px solid var(--border, #e4e4e7)",
				borderRadius: 6,
				padding: 10,
			}}
		>
			<h3 style={{ fontSize: 13, margin: "0 0 6px" }}>Debug sessions</h3>
			<p
				style={{
					fontSize: 11,
					color: "var(--muted-foreground, #71717a)",
					margin: "0 0 8px",
				}}
			>
				Capture bounded, sanitized evidence from the current runtime view and
				compare the two most recent captures.
			</p>
			<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
				<Label style={{ fontSize: 12, display: "flex", gap: 5 }}>
					<Checkbox checked={shared} onCheckedChange={onSharedChange} />
					Share across tabs
				</Label>
				<Button type="button" onClick={onCapture}>
					Capture debug session
				</Button>
				<Button type="button" onClick={onExport} disabled={sessionCount === 0}>
					Export latest session
				</Button>
				<Button type="button" onClick={onClear} disabled={sessionCount === 0}>
					Clear sessions
				</Button>
			</div>
			<div style={{ fontSize: 11, marginTop: 8 }}>
				{sessionCount} debug session{sessionCount === 1 ? "" : "s"} captured
			</div>
			{comparison && (
				<p style={{ fontSize: 11, margin: "6px 0 0" }}>
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
