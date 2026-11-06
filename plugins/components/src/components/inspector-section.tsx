import type * as React from "react";

export function InspectorSection({
	title,
	count,
	children,
}: {
	title: string;
	count?: number | undefined;
	children: React.ReactNode;
}) {
	return (
		<section
			aria-label={title}
			className="devtools:rounded-sm devtools:border devtools:border-border devtools:p-1.5"
		>
			<h3 className="devtools:m-0 devtools:mb-1 devtools:flex devtools:items-center devtools:justify-between devtools:text-[11px] devtools:font-semibold">
				{title}
				{typeof count === "number" ? (
					<span className="devtools:font-normal devtools:text-muted-foreground">
						{count}
					</span>
				) : null}
			</h3>
			<div className="devtools:whitespace-pre-wrap devtools:break-words devtools:font-mono devtools:text-[11px] devtools:text-muted-foreground">
				{children}
			</div>
		</section>
	);
}
