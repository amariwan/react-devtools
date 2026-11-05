"use client";

import {
	STATUS_LABELS,
	type StatusTone,
	statusTone,
} from "../../helpers/status.js";
import { cn } from "../../lib/utils.js";

const STATUS_DOT_CLASSES: Record<StatusTone, string> = {
	available: "devtools:bg-green-600 devtools:dark:bg-green-500",
	partial: "devtools:bg-amber-600 devtools:dark:bg-amber-500",
	"requires-instrumentation": "devtools:bg-blue-600 devtools:dark:bg-blue-500",
	experimental: "devtools:bg-violet-600 devtools:dark:bg-violet-500",
	unavailable: "devtools:bg-red-600 devtools:dark:bg-red-500",
	error: "devtools:bg-red-600 devtools:dark:bg-red-500",
	diagnostic: "devtools:bg-red-500 devtools:dark:bg-red-500",
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
