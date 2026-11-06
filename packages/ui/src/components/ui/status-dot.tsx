"use client";

import {
	STATUS_LABELS,
	type StatusTone,
	statusTone,
} from "../../helpers/status.js";
import { cn } from "../../lib/utils.js";

const STATUS_DOT_CLASSES: Record<StatusTone, string> = {
	available: "devtools:bg-success",
	partial: "devtools:bg-warning",
	"requires-instrumentation": "devtools:bg-info",
	experimental: "devtools:bg-violet-600 devtools:dark:bg-violet-500",
	unavailable: "devtools:bg-destructive",
	error: "devtools:bg-destructive",
	diagnostic: "devtools:bg-destructive",
};

export interface StatusDotProps {
	/** Availability or runtime-status string, e.g. `available` | `error`. */
	status: string;
	label?: string;
	className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
	const tone = statusTone(status);
	return (
		<span
			className={cn(
				"devtools:inline-flex devtools:items-center devtools:gap-1.5 devtools:text-xs devtools:text-muted-foreground",
				className,
			)}
		>
			<span
				aria-hidden
				className={cn(
					"devtools:size-2 devtools:rounded-full",
					STATUS_DOT_CLASSES[tone],
				)}
			/>
			<span>{label ?? STATUS_LABELS[tone]}</span>
		</span>
	);
}
