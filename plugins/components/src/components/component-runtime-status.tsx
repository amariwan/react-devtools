import type { ReactRuntimeSnapshot } from "@next-devtools/runtime-react";
import { EmptyState } from "@next-devtools/ui";

type ComponentRuntimeStatusProps = {
	available: boolean;
	unavailableReason: string;
	suspense: ReactRuntimeSnapshot["suspense"];
};

export function ComponentRuntimeStatus({
	available,
	unavailableReason,
	suspense,
}: ComponentRuntimeStatusProps) {
	if (!available) {
		return (
			<EmptyState
				title="React component inspection is unavailable"
				description={unavailableReason}
			/>
		);
	}
	return (
		<div
			aria-label="Suspense diagnostics"
			style={{
				fontSize: 11,
				color: "var(--muted-foreground, #71717a)",
				padding: "6px 8px",
				border: "1px solid var(--border, #e4e4e7)",
				borderRadius: 4,
			}}
		>
			Suspense boundaries: {suspense?.length ?? 0}
			{suspense?.length
				? ` · ${suspense.map((boundary) => `${boundary.displayName} (${boundary.status})`).join(", ")}`
				: ""}
		</div>
	);
}
