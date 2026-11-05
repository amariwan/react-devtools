"use client";

import { ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils.js";

interface BreadcrumbItem {
	label: string;
	onClick?: () => void;
}

export function Breadcrumbs({
	items,
	className,
}: {
	items: readonly BreadcrumbItem[];
	className?: string;
}) {
	return (
		<nav
			aria-label="Breadcrumb"
			className={cn(
				"devtools:flex devtools:items-center devtools:gap-1 devtools:text-xs devtools:text-muted-foreground",
				className,
			)}
		>
			{items.map((item, i) => (
				<React.Fragment
					key={`${item.label}:${item.onClick ? "link" : "current"}`}
				>
					{i > 0 ? (
						<ChevronRightIcon
							className="devtools:size-3 devtools:text-muted-foreground/60"
							aria-hidden
						/>
					) : null}
					{item.onClick ? (
						<button
							type="button"
							onClick={item.onClick}
							className="devtools:rounded devtools:hover:text-foreground"
						>
							{item.label}
						</button>
					) : (
						<span className="devtools:text-foreground">{item.label}</span>
					)}
				</React.Fragment>
			))}
		</nav>
	);
}
