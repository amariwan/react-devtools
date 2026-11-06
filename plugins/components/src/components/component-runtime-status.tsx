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
			className="devtools:rounded-sm devtools:border devtools:border-border devtools:px-2 devtools:py-1.5 devtools:text-[11px] devtools:text-muted-foreground"
		>
			Suspense boundaries: {suspense?.length ?? 0}
			{suspense?.length
				? ` · ${suspense.map((boundary) => `${boundary.displayName} (${boundary.status})`).join(", ")}`
				: ""}
		</div>
	);
}
