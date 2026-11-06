"use client";

import type * as React from "react";
import { cn } from "../../lib/utils.js";

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	actions?: React.ReactNode;
}

export function PanelHeader({
	title,
	description,
	actions,
	className,
	...props
}: PanelHeaderProps) {
	return (
		<div
			data-slot="panel-header"
			className={cn(
				"devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-3 devtools:border-b devtools:border-border devtools:bg-card devtools:px-4 devtools:py-3.5 devtools:@max-[520px]/devtools:py-2",
				className,
			)}
			{...props}
		>
			<div className="devtools:min-w-0 devtools:flex-1">
				<h2 className="devtools:truncate devtools:text-sm devtools:font-medium devtools:text-foreground devtools:@max-[520px]/devtools:sr-only">
					{title}
				</h2>
				{description ? (
					<p className="devtools:mt-0.5 devtools:text-xs devtools:leading-relaxed devtools:text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-1">
					{actions}
				</div>
			) : null}
		</div>
	);
}
