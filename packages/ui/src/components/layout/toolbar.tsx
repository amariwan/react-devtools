"use client";

import type * as React from "react";
import { cn } from "../../lib/utils.js";

export function Toolbar({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-2 devtools:py-1",
				className,
			)}
			{...props}
		/>
	);
}
