"use client";

import type * as React from "react";
import { cn } from "../../lib/utils.js";

export interface SettingsRowProps {
	label: string;
	description?: string;
	children?: React.ReactNode;
	className?: string;
}

export function SettingsRow({
	label,
	description,
	children,
	className,
}: SettingsRowProps) {
	return (
		<div
			className={cn(
				"devtools:flex devtools:items-center devtools:justify-between devtools:gap-4 devtools:py-2",
				className,
			)}
		>
			<div className="devtools:min-w-0">
				<div className="devtools:text-sm devtools:text-foreground">{label}</div>
				{description ? (
					<div className="devtools:text-xs devtools:text-muted-foreground">
						{description}
					</div>
				) : null}
			</div>
			<div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-2">
				{children}
			</div>
		</div>
	);
}
