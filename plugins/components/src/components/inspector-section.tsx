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
			style={{
				border: "1px solid var(--border, #e4e4e7)",
				borderRadius: 4,
				padding: 6,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					fontSize: 11,
					fontWeight: 600,
					marginBottom: 4,
				}}
			>
				<span>{title}</span>
				{typeof count === "number" ? (
					<span
						style={{
							color: "var(--muted-foreground, #71717a)",
							fontWeight: 400,
						}}
					>
						{count}
					</span>
				) : null}
			</div>
			<pre
				style={{
					margin: 0,
					fontSize: 11,
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					fontFamily: "monospace",
					color: "var(--muted-foreground, #3f3f46)",
				}}
			>
				{children}
			</pre>
		</section>
	);
}
