"use client";

import type * as React from "react";
import { cn } from "../../lib/utils.js";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "secondary" | "outline" | "destructive";
}

export function Badge({
	className,
	variant = "default",
	...props
}: BadgeProps) {
	return (
		<span
			data-slot="badge"
			className={cn(
				"devtools:inline-flex devtools:items-center devtools:gap-1 devtools:rounded-md devtools:border devtools:px-1.5 devtools:py-1 devtools:text-xs devtools:font-medium devtools:leading-none devtools:whitespace-nowrap",
				variant === "default" &&
					"devtools:border-transparent devtools:bg-primary devtools:text-primary-foreground",
				variant === "secondary" &&
					"devtools:border-transparent devtools:bg-muted devtools:text-muted-foreground",
				variant === "outline" &&
					"devtools:border-border devtools:text-muted-foreground",
				variant === "destructive" &&
					"devtools:border-transparent devtools:bg-destructive/10 devtools:text-destructive",
				className,
			)}
			{...props}
		/>
	);
}
