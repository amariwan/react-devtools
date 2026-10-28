import type { TimelineEvent } from "./timeline-store.js";

export type ProfilerCommit = {
  readonly eventId: string;
  readonly id: string;
  readonly phase: string;
  readonly actualDuration: number;
  readonly baseDuration: number;
  readonly startTime: number;
  readonly commitTime: number;
  readonly timestampUnixMs: number;
};

export type ProfilerRank = {
  readonly id: string;
  readonly commits: number;
  readonly totalActualDuration: number;
  readonly averageActualDuration: number;
  readonly maxActualDuration: number;
  readonly totalBaseDuration: number;
};

export type ProfilerInsights = {
  readonly commits: readonly ProfilerCommit[];
  readonly ranked: readonly ProfilerRank[];
  readonly totalActualDuration: number;
  readonly totalBaseDuration: number;
  readonly maxActualDuration: number;
};

export type ProfilerComparisonRank = {
  readonly id: string;
  readonly beforeCommits: number;
  readonly afterCommits: number;
  readonly commitDelta: number;
  readonly beforeActualDuration: number;
  readonly afterActualDuration: number;
  readonly actualDurationDelta: number;
  readonly status: "added" | "removed" | "changed" | "unchanged";
};

export type ProfilerComparison = {
  readonly ranked: readonly ProfilerComparisonRank[];
  readonly totalActualDurationDelta: number;
  readonly totalCommitDelta: number;
};

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readCommit(event: TimelineEvent): ProfilerCommit | undefined {
  if (event.layer !== "react-profiler" || event.type !== "commit") return;
  if (!event.payload || typeof event.payload !== "object") return;
  const payload = event.payload as Record<string, unknown>;
  const id =
    typeof payload.id === "string" && payload.id ? payload.id : undefined;
  const phase =
    typeof payload.phase === "string" && payload.phase
      ? payload.phase
      : undefined;
  const actualDuration = finiteNumber(payload.actualDuration);
  const baseDuration = finiteNumber(payload.baseDuration);
  const startTime = finiteNumber(payload.startTime);
  const commitTime = finiteNumber(payload.commitTime);
  if (
    !id ||
    !phase ||
    actualDuration === undefined ||
    baseDuration === undefined ||
    startTime === undefined ||
    commitTime === undefined
  )
    return;
  return {
    eventId: event.id,
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    timestampUnixMs: event.timestampUnixMs,
  };
}

export function buildProfilerInsights(
  events: readonly TimelineEvent[],
  limit = 50,
): ProfilerInsights {
  const commits = events
    .map(readCommit)
    .filter((commit): commit is ProfilerCommit => commit !== undefined);
  const aggregates = new Map<string, ProfilerRank>();
  for (const commit of commits) {
    const previous = aggregates.get(commit.id);
    aggregates.set(commit.id, {
      id: commit.id,
      commits: (previous?.commits ?? 0) + 1,
      totalActualDuration:
        (previous?.totalActualDuration ?? 0) + commit.actualDuration,
      averageActualDuration: 0,
      maxActualDuration: Math.max(
        previous?.maxActualDuration ?? 0,
        commit.actualDuration,
      ),
      totalBaseDuration:
        (previous?.totalBaseDuration ?? 0) + commit.baseDuration,
    });
  }
  const ranked = Array.from(aggregates.values(), (rank) => ({
    ...rank,
    averageActualDuration: rank.totalActualDuration / rank.commits,
  }))
    .sort(
      (left, right) =>
        right.totalActualDuration - left.totalActualDuration ||
        right.commits - left.commits ||
        left.id.localeCompare(right.id),
    )
    .slice(0, Math.max(1, Math.min(100, Math.floor(limit))));
  return {
    commits,
    ranked,
    totalActualDuration: commits.reduce(
      (total, commit) => total + commit.actualDuration,
      0,
    ),
    totalBaseDuration: commits.reduce(
      (total, commit) => total + commit.baseDuration,
      0,
    ),
    maxActualDuration: Math.max(
      0,
      ...commits.map((commit) => commit.actualDuration),
    ),
  };
}

export function compareProfilerInsights(
  before: ProfilerInsights,
  after: ProfilerInsights,
  limit = 50,
): ProfilerComparison {
  const beforeById = new Map(before.ranked.map((rank) => [rank.id, rank]));
  const afterById = new Map(after.ranked.map((rank) => [rank.id, rank]));
  const ids = new Set([...beforeById.keys(), ...afterById.keys()]);
  const ranked = Array.from(ids, (id) => {
    const beforeRank = beforeById.get(id);
    const afterRank = afterById.get(id);
    const beforeCommits = beforeRank?.commits ?? 0;
    const afterCommits = afterRank?.commits ?? 0;
    const beforeActualDuration = beforeRank?.totalActualDuration ?? 0;
    const afterActualDuration = afterRank?.totalActualDuration ?? 0;
    const status = !beforeRank
      ? "added"
      : !afterRank
        ? "removed"
        : beforeCommits === afterCommits &&
            beforeActualDuration === afterActualDuration
          ? "unchanged"
          : "changed";
    return {
      id,
      beforeCommits,
      afterCommits,
      commitDelta: afterCommits - beforeCommits,
      beforeActualDuration,
      afterActualDuration,
      actualDurationDelta: afterActualDuration - beforeActualDuration,
      status,
    } satisfies ProfilerComparisonRank;
  })
    .sort(
      (left, right) =>
        Math.abs(right.actualDurationDelta) -
          Math.abs(left.actualDurationDelta) ||
        Math.abs(right.commitDelta) - Math.abs(left.commitDelta) ||
        left.id.localeCompare(right.id),
    )
    .slice(0, Math.max(1, Math.min(100, Math.floor(limit))));
  return {
    ranked,
    totalActualDurationDelta:
      after.totalActualDuration - before.totalActualDuration,
    totalCommitDelta: after.commits.length - before.commits.length,
  };
}
