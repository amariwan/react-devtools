import type { TimelinePanelData } from "../timeline-data.js";

type TimelineEventListProps = {
	events: TimelinePanelData["events"];
};

function formatPayload(payload: unknown): string {
	try {
		const value = JSON.stringify(payload);
		return value === undefined ? String(payload) : value;
	} catch {
		return "[unserializable payload]";
	}
}

export function TimelineEventList({ events }: TimelineEventListProps) {
	return (
		<ul
			style={{
				listStyle: "none",
				padding: 0,
				margin: 0,
				display: "flex",
				flexDirection: "column",
				gap: 4,
				maxHeight: 420,
				overflow: "auto",
			}}
		>
			{[...events].reverse().map((event) => (
				<li
					key={event.id}
					style={{
						fontSize: 11,
						padding: "6px 8px",
						border: "1px solid var(--border, #e4e4e7)",
						borderRadius: 4,
						display: "flex",
						flexDirection: "column",
						gap: 4,
						overflowWrap: "anywhere",
						background: "var(--card)",
					}}
				>
					<span style={{ fontFamily: "monospace" }}>
						{event.layer} · {event.type}
					</span>
					<span style={{ color: "var(--muted-foreground, #71717a)" }}>
						{new Date(event.timestampUnixMs).toLocaleTimeString()} ·{" "}
						{formatPayload(event.payload)}
					</span>
				</li>
			))}
		</ul>
	);
}
