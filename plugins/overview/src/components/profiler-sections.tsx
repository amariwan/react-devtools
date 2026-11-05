import type { ProfilerComparison, ProfilerInsights } from "@next-devtools/core";

type ProfilerSectionsProps = {
	comparison: ProfilerComparison | null;
	profiler: ProfilerInsights;
};

export function ProfilerSections({
	comparison,
	profiler,
}: ProfilerSectionsProps) {
	return (
		<>
			{comparison && (
				<section
					style={{
						border: "1px solid var(--border, #e4e4e7)",
						borderRadius: 6,
						padding: 10,
					}}
				>
					<h3 style={{ fontSize: 13, margin: "0 0 6px" }}>
						Profiler · before / after
					</h3>
					<p
						style={{
							fontSize: 11,
							color: "var(--muted-foreground, #71717a)",
							margin: "0 0 8px",
						}}
					>
						Measured difference from the captured baseline; no render cause is
						inferred. {comparison.totalCommitDelta >= 0 ? "+" : ""}
						{comparison.totalCommitDelta} commits ·{" "}
						{comparison.totalActualDurationDelta >= 0 ? "+" : ""}
						{comparison.totalActualDurationDelta.toFixed(2)} ms actual
					</p>
					<ul style={{ margin: 0, paddingLeft: 20, fontSize: 11 }}>
						{comparison.ranked.slice(0, 10).map((rank) => (
							<li key={rank.id}>
								<span style={{ fontFamily: "monospace" }}>{rank.id}</span> ·{" "}
								{rank.status} · {rank.commitDelta >= 0 ? "+" : ""}
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
					<section
						style={{
							border: "1px solid var(--border, #e4e4e7)",
							borderRadius: 6,
							padding: 10,
						}}
					>
						<h3 style={{ fontSize: 13, margin: "0 0 6px" }}>
							React Profiler · ranked renders
						</h3>
						<p
							style={{
								fontSize: 11,
								color: "var(--muted-foreground, #71717a)",
								margin: "0 0 8px",
							}}
						>
							{profiler.commits.length} commits ·{" "}
							{profiler.totalActualDuration.toFixed(2)} ms actual · max{" "}
							{profiler.maxActualDuration.toFixed(2)} ms
						</p>
						<ol style={{ margin: 0, paddingLeft: 20, fontSize: 11 }}>
							{profiler.ranked.slice(0, 10).map((rank) => (
								<li key={rank.id}>
									<span style={{ fontFamily: "monospace" }}>{rank.id}</span> ·{" "}
									{rank.commits} commits · {rank.totalActualDuration.toFixed(2)}{" "}
									ms total · {rank.averageActualDuration.toFixed(2)} ms avg
								</li>
							))}
						</ol>
					</section>
					<section
						aria-label="Recent React profiler commits"
						style={{
							border: "1px solid var(--border, #e4e4e7)",
							borderRadius: 6,
							padding: 10,
						}}
					>
						<h3 style={{ fontSize: 13, margin: "0 0 6px" }}>
							Recent measured commits
						</h3>
						<ul style={{ margin: 0, paddingLeft: 20, fontSize: 11 }}>
							{[...profiler.commits]
								.reverse()
								.slice(0, 10)
								.map((commit) => (
									<li key={commit.eventId}>
										<span style={{ fontFamily: "monospace" }}>{commit.id}</span>{" "}
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
