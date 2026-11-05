"use client";

import type * as React from "react";
import { cn } from "../../lib/utils.js";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface EmptyStateProps {
	icon?: IconComponent;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"devtools:flex devtools:flex-col devtools:items-center devtools:justify-center devtools:gap-3 devtools:px-6 devtools:py-16 devtools:text-center",
				className,
			)}
		>
			{Icon ? (
				<span
					aria-hidden
					className="devtools:flex devtools:size-10 devtools:items-center devtools:justify-center devtools:rounded-full devtools:bg-muted devtools:text-muted-foreground"
				>
					<Icon className="devtools:size-5" />
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
