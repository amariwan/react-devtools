import { Button, EmptyState, ErrorState } from "@next-devtools/ui";
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
	readonly compact?: boolean;
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
	compact = false,
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
		if (!view.rootComponentId) {
			return (
				<EmptyState
					title="Select a component"
					description="Choose one in the Components panel to inspect its dependencies."
				/>
			);
		}

		const reason = describeEmptyReason(view, {
			runtimeStatus,
			dependenciesCapable,
			dependencySetLoaded,
			hiddenByKind,
		});
		if (compact) {
			return (
				<div
					role="status"
					className="devtools:flex devtools:flex-wrap devtools:justify-center devtools:gap-2 devtools:px-3 devtools:py-2 devtools:text-center devtools:text-xs devtools:leading-relaxed devtools:text-muted-foreground"
				>
					<strong className="devtools:font-medium devtools:text-foreground">
						No reactive dependencies
					</strong>
					<span>{reason}</span>
				</div>
			);
		}
		return (
			<EmptyState
				title="No reactive dependencies"
				description={reason}
				action={
					hiddenByKind > 0 ? (
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={onResetFilters}
						>
							Reset filters
						</Button>
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
