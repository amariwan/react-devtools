import { Button, buttonVariants, cn } from "@next-devtools/ui";
import type * as React from "react";

export function QuickLink({
	icon: Icon,
	label,
	href,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	label: string;
	href?: string;
	onClick?: () => void;
}) {
	const className = cn(
		buttonVariants({ variant: "ghost", size: "xs" }),
		"devtools:text-muted-foreground",
	);
	if (href) {
		return (
			<a href={href} target="_blank" rel="noreferrer" className={className}>
				<Icon aria-hidden className="devtools:size-3.5" />
				{label}
			</a>
		);
	}
	return (
		<Button
			type="button"
			onClick={onClick}
			variant="ghost"
			size="xs"
			className="devtools:text-muted-foreground"
		>
			<Icon aria-hidden className="devtools:size-3.5" />
			{label}
		</Button>
	);
}
