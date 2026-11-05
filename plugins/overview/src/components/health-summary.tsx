import { CheckCircle2, TriangleAlert } from "lucide-react";

type OverviewIssue = { title: string; detail: string };

export function HealthSummary({
	issues,
	diagnosticCount,
}: { issues: readonly OverviewIssue[]; diagnosticCount: number }) {
	return (
		<>
			{issues.length > 0 && (
				<div className="devtools:w-full devtools:max-w-xl devtools:space-y-2">
					{issues.map((issue) => (
						<div
							key={issue.title}
							role="alert"
							className="devtools:flex devtools:gap-2 devtools:rounded-md devtools:border devtools:border-destructive/30 devtools:bg-destructive/10 devtools:p-3 devtools:text-left devtools:text-xs"
						>
							<TriangleAlert
								aria-hidden
								className="devtools:size-4 devtools:shrink-0 devtools:text-destructive"
							/>
							<div className="devtools:min-w-0 devtools:break-words">
								<strong>{issue.title}</strong>
								<p className="devtools:mt-1 devtools:text-muted-foreground">
									{issue.detail}
								</p>
							</div>
						</div>
					))}
				</div>
			)}

			{issues.length === 0 && (
				<p className="devtools:flex devtools:items-center devtools:gap-2 devtools:text-xs devtools:text-muted-foreground">
					<CheckCircle2
						aria-hidden
						className="devtools:size-4 devtools:text-success"
					/>
					All registered plugins and runtime services are healthy.
				</p>
			)}
			<p className="devtools:text-xs devtools:text-muted-foreground">
				Diagnostics: {diagnosticCount} captured
			</p>
		</>
	);
}
