import { describe, expect, it } from "vitest";
import {
  buildProfilerInsights,
  compareProfilerInsights,
} from "@next-devtools/core";

describe("profiler insights", () => {
  it("ranks measured components by total actual duration", () => {
    const result = buildProfilerInsights([
      {
        id: "one",
        layer: "react-profiler",
        type: "commit",
        timestampUnixMs: 1,
        payload: {
          id: "App",
          phase: "mount",
          actualDuration: 2,
          baseDuration: 3,
          startTime: 0,
          commitTime: 2,
        },
      },
      {
        id: "two",
        layer: "react-profiler",
        type: "commit",
        timestampUnixMs: 2,
        payload: {
          id: "List",
          phase: "update",
          actualDuration: 8,
          baseDuration: 10,
          startTime: 2,
          commitTime: 10,
        },
      },
      {
        id: "three",
        layer: "react-profiler",
        type: "commit",
        timestampUnixMs: 3,
        payload: {
          id: "List",
          phase: "update",
          actualDuration: 4,
          baseDuration: 6,
          startTime: 10,
          commitTime: 14,
        },
      },
    ]);

    expect(result.ranked[0]).toMatchObject({
      id: "List",
      commits: 2,
      totalActualDuration: 12,
      averageActualDuration: 6,
      maxActualDuration: 8,
    });
    expect(result.commits).toHaveLength(3);
    expect(result.totalActualDuration).toBe(14);
  });

  it("ignores malformed or non-profiler events", () => {
    expect(
      buildProfilerInsights([
        {
          id: "ignored",
          layer: "navigation",
          type: "change",
          timestampUnixMs: 1,
          payload: {},
        },
        {
          id: "malformed",
          layer: "react-profiler",
          type: "commit",
          timestampUnixMs: 2,
          payload: { id: "App" },
        },
      ]),
    ).toMatchObject({ commits: [], ranked: [], totalActualDuration: 0 });
  });

  it("compares a captured baseline with current measurements", () => {
    const before = buildProfilerInsights([
      {
        id: "one",
        layer: "react-profiler",
        type: "commit",
        timestampUnixMs: 1,
        payload: {
          id: "App",
          phase: "mount",
          actualDuration: 4,
          baseDuration: 4,
          startTime: 0,
          commitTime: 4,
        },
      },
    ]);
    const after = buildProfilerInsights([
      {
        id: "two",
        layer: "react-profiler",
        type: "commit",
        timestampUnixMs: 2,
        payload: {
          id: "App",
          phase: "update",
          actualDuration: 7,
          baseDuration: 8,
          startTime: 4,
          commitTime: 11,
        },
      },
      {
        id: "three",
        layer: "react-profiler",
        type: "commit",
        timestampUnixMs: 3,
        payload: {
          id: "NewPanel",
          phase: "mount",
          actualDuration: 2,
          baseDuration: 2,
          startTime: 11,
          commitTime: 13,
        },
      },
    ]);

    const comparison = compareProfilerInsights(before, after);
    expect(comparison).toMatchObject({
      totalCommitDelta: 1,
      totalActualDurationDelta: 5,
    });
    expect(comparison.ranked.find((rank) => rank.id === "App")).toMatchObject({
      status: "changed",
      commitDelta: 0,
      actualDurationDelta: 3,
    });
    expect(
      comparison.ranked.find((rank) => rank.id === "NewPanel"),
    ).toMatchObject({ status: "added", actualDurationDelta: 2 });
  });
});
