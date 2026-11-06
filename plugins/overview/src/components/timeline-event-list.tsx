import { Button } from "@next-devtools/ui";
import * as React from "react";
import type { TimelinePanelData } from "../timeline-data.js";

const INITIAL_EVENT_COUNT = 100;
const EVENT_PAGE_SIZE = 100;

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
	const [visibleCount, setVisibleCount] = React.useState(INITIAL_EVENT_COUNT);
	React.useEffect(() => {
		if (events.length === 0) setVisibleCount(INITIAL_EVENT_COUNT);
	}, [events.length]);
	const firstVisibleIndex = Math.max(0, events.length - visibleCount);
	const visibleEvents = events.slice(firstVisibleIndex).reverse();
	const olderCount = firstVisibleIndex;

	return (
		<div
			role="region"
			aria-label="Timeline events"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable events must be keyboard reachable.
			tabIndex={0}
			className="devtools:max-h-[420px] devtools:overflow-auto devtools:focus-visible:outline-none devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring"
		>
			<ul className="devtools:m-0 devtools:flex devtools:list-none devtools:flex-col devtools:gap-1 devtools:p-0">
				{visibleEvents.map((event) => (
					<li
						key={event.id}
						className="devtools:flex devtools:shrink-0 devtools:flex-col devtools:gap-1 devtools:overflow-hidden devtools:break-all devtools:rounded-sm devtools:border devtools:border-border devtools:bg-card devtools:px-2 devtools:py-1.5 devtools:text-[11px]"
					>
						<span className="devtools:font-mono">
							{event.layer} · {event.type}
						</span>
						<span className="devtools:text-muted-foreground">
							{new Date(event.timestampUnixMs).toLocaleTimeString()} ·{" "}
							{formatPayload(event.payload)}
						</span>
					</li>
				))}
				{olderCount > 0 && (
					<li className="devtools:shrink-0">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label={`Load ${Math.min(EVENT_PAGE_SIZE, olderCount)} older timeline events`}
							onClick={() =>
								setVisibleCount((count) =>
									Math.min(count + EVENT_PAGE_SIZE, events.length),
								)
							}
						>
							Load {Math.min(EVENT_PAGE_SIZE, olderCount)} older events
						</Button>
					</li>
				)}
			</ul>
		</div>
	);
}
