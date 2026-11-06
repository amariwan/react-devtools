import type { ProfilerComparison, ProfilerInsights } from "@next-devtools/core";

type ProfilerSectionsProps = {
	comparison: ProfilerComparison | null;
	profiler: ProfilerInsights;
};

const sectionClassName =
	"devtools:rounded-md devtools:border devtools:border-border devtools:p-2.5";
const headingClassName =
	"devtools:mb-1.5 devtools:text-sm devtools:font-semibold";
const detailClassName =
	"devtools:mb-2 devtools:text-[11px] devtools:text-muted-foreground";
const listClassName =
	"devtools:m-0 devtools:space-y-1 devtools:pl-5 devtools:text-[11px]";

export function ProfilerSections({
	comparison,
	profiler,
}: ProfilerSectionsProps) {
	return (
		<>
			{comparison && (
				<section className={sectionClassName}>
					<h3 className={headingClassName}>Profiler · before / after</h3>
					<p className={detailClassName}>
						Measured difference from the captured baseline; no render cause is
						inferred. {comparison.totalCommitDelta >= 0 ? "+" : ""}
						{comparison.totalCommitDelta} commits ·{" "}
						{comparison.totalActualDurationDelta >= 0 ? "+" : ""}
						{comparison.totalActualDurationDelta.toFixed(2)} ms actual
					</p>
					<ul className={listClassName}>
						{comparison.ranked.slice(0, 10).map((rank) => (
							<li key={rank.id}>
								<span className="devtools:font-mono devtools:text-foreground">
									{rank.id}
								</span>{" "}
								· {rank.status} · {rank.commitDelta >= 0 ? "+" : ""}
								{rank.commitDelta} commits ·{" "}
								{rank.actualDurationDelta >= 0 ? "+" : ""}
								{rank.actualDurationDelta.toFixed(2)} ms
							</li>
						))}
					</ul>
				</section>
			)}
			{profiler.commits.length > 0 && (
				<>
					<section className={sectionClassName}>
						<h3 className={headingClassName}>
							React Profiler · ranked renders
						</h3>
						<p className={detailClassName}>
							{profiler.commits.length} commits ·{" "}
							{profiler.totalActualDuration.toFixed(2)} ms actual · max{" "}
							{profiler.maxActualDuration.toFixed(2)} ms
						</p>
						<ol className={listClassName}>
							{profiler.ranked.slice(0, 10).map((rank) => (
								<li key={rank.id}>
									<span className="devtools:font-mono devtools:text-foreground">
										{rank.id}
									</span>{" "}
									· {rank.commits} commits ·{" "}
									{rank.totalActualDuration.toFixed(2)} ms total ·{" "}
									{rank.averageActualDuration.toFixed(2)} ms avg
								</li>
							))}
						</ol>
					</section>
					<section
						aria-label="Recent React profiler commits"
						className={sectionClassName}
					>
						<h3 className={headingClassName}>Recent measured commits</h3>
						<ul className={listClassName}>
							{[...profiler.commits]
								.reverse()
								.slice(0, 10)
								.map((commit) => (
									<li key={commit.eventId}>
										<span className="devtools:font-mono devtools:text-foreground">
											{commit.id}
										</span>{" "}
										· {commit.phase} · {commit.actualDuration.toFixed(2)} ms
										actual · {commit.baseDuration.toFixed(2)} ms base
									</li>
								))}
						</ul>
					</section>
				</>
			)}
		</>
	);
}
