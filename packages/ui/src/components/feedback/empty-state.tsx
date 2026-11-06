"use client";

import type * as React from "react";
import { cn } from "../../lib/utils.js";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface EmptyStateProps {
	icon?: IconComponent;
	title: string;
	description?: string;
	action?: React.ReactNode;
	compact?: boolean;
	layout?: "stacked" | "inline";
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	compact = false,
	layout = "stacked",
	className,
}: EmptyStateProps) {
	return (
		<div
			data-slot="empty-state"
			className={cn(
				"devtools:flex devtools:flex-col devtools:items-center devtools:justify-center devtools:px-6 devtools:text-center",
				layout === "inline"
					? "devtools:flex-row devtools:justify-start devtools:gap-3 devtools:px-3 devtools:py-2 devtools:text-left"
					: compact
						? "devtools:gap-2 devtools:py-5"
						: "devtools:gap-3 devtools:py-16",
				className,
			)}
		>
			{Icon ? (
				<span
					aria-hidden
					className={cn(
						"devtools:flex devtools:items-center devtools:justify-center devtools:rounded-full devtools:bg-muted devtools:text-muted-foreground",
						layout === "inline"
							? "devtools:size-7 devtools:shrink-0"
							: "devtools:size-10",
					)}
				>
					<Icon
						className={
							layout === "inline" ? "devtools:size-4" : "devtools:size-5"
						}
					/>
				</span>
			) : null}
			<div className="devtools:text-sm devtools:font-semibold devtools:tracking-tight devtools:text-foreground">
				{title}
			</div>
			{description ? (
				<div className="devtools:max-w-xs devtools:text-xs devtools:leading-relaxed devtools:text-muted-foreground">
					{description}
				</div>
			) : null}
			{action ? <div className="devtools:mt-1">{action}</div> : null}
		</div>
	);
}
