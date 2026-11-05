import { Badge, Card, CardContent } from "@next-devtools/ui";
import type * as React from "react";

export function SummaryCard({
	icon: Icon,
	label,
	value,
	hint,
}: {
	icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
	label: string;
	value: string | number;
	hint?: string;
}) {
	return (
		<Card className="devtools:min-w-[140px] devtools:items-center devtools:px-6 devtools:py-5 devtools:shadow-sm devtools:transition-colors devtools:motion-reduce:transition-none devtools:hover:bg-muted/40">
			<CardContent className="devtools:flex devtools:flex-col devtools:items-center devtools:gap-1.5 devtools:p-0">
				{Icon && (
					<Icon
						aria-hidden
						className="devtools:size-5 devtools:text-muted-foreground"
					/>
				)}
				<span className="devtools:text-2xl devtools:font-semibold devtools:tabular-nums devtools:text-foreground">
					{value}
				</span>
				<span className="devtools:text-xs devtools:font-medium devtools:text-muted-foreground">
					{label}
				</span>
				{hint && (
					<Badge variant="secondary" className="devtools:text-[10px]">
						{hint}
					</Badge>
				)}
			</CardContent>
		</Card>
	);
}
