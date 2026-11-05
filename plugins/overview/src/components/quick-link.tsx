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
	const className =
		"devtools:inline-flex devtools:items-center devtools:gap-1.5 devtools:text-xs devtools:text-muted-foreground devtools:opacity-70 devtools:transition-all devtools:motion-reduce:transition-none devtools:hover:opacity-100 devtools:hover:text-foreground";
	if (href) {
		return (
			<a href={href} target="_blank" rel="noreferrer" className={className}>
				<Icon aria-hidden className="devtools:size-3.5" />
				{label}
			</a>
		);
	}
	return (
		<button type="button" onClick={onClick} className={className}>
			<Icon aria-hidden className="devtools:size-3.5" />
			{label}
		</button>
	);
}
