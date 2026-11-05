import { EmptyState, ErrorState } from "@next-devtools/ui";
import type { GraphView } from "../lib/graph-model.js";
import { describeEmptyReason } from "../lib/graph-transform.js";

export interface GraphStatesProps {
	readonly view: GraphView;
	readonly runtimeStatus: string;
	readonly dependenciesCapable: boolean;
	readonly dependencySetLoaded: boolean;
	readonly loading: boolean;
	readonly dependencyError?: string;
	readonly onReload: () => void;
	readonly onResetFilters: () => void;
	readonly hiddenByKind: number;
}

export function GraphStates({
	view,
	runtimeStatus,
	dependenciesCapable,
	dependencySetLoaded,
	loading,
	dependencyError,
	onReload,
	onResetFilters,
	hiddenByKind,
}: GraphStatesProps) {
	if (loading) {
		return (
			<EmptyState
				title="Loading reactive dependencies"
				description="Reading the selected component's Fiber data. No graph is shown until evidence is available."
			/>
		);
	}

	if (runtimeStatus === "error" || dependencyError) {
		return (
			<ErrorState
				title="Dependency extraction failed"
				message={
					dependencyError ??
					view.reason ??
					"The React runtime reported an error."
				}
				onRetry={onReload}
			/>
		);
	}

	if (view.status === "unavailable") {
		return (
			<EmptyState
				title="React runtime unavailable"
				description="Open the app with the DevTools provider enabled to inspect reactive dependencies."
			/>
		);
	}

	if (view.status === "unsupported") {
		return (
			<EmptyState
				title="Dependency extraction unavailable"
				description="This React adapter cannot extract reactive dependencies. No graph is fabricated as a fallback."
			/>
		);
	}

	if (view.status === "empty") {
		const reason = describeEmptyReason(view, {
			runtimeStatus,
			dependenciesCapable,
			dependencySetLoaded,
			hiddenByKind,
		});
		return (
			<EmptyState
				title="No reactive dependencies"
				description={reason}
				action={
					hiddenByKind > 0 ? (
						<button
							type="button"
							onClick={onResetFilters}
							style={{
								padding: "4px 10px",
								borderRadius: 6,
								border: "1px solid var(--border, rgba(127,127,127,0.25))",
								background: "transparent",
								cursor: "pointer",
								fontSize: 12,
							}}
						>
							Reset filters
						</button>
					) : undefined
				}
			/>
		);
	}

	if (view.nodeLimitReached) {
		return null;
	}

	return null;
}
