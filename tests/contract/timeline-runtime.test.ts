import { describe, expect, it } from "vitest";
import { createTimelineRuntime } from "@next-devtools/core";

describe("timeline runtime", () => {
  it("registers layers and removes only the matching registration", () => {
    const runtime = createTimelineRuntime();
    const first = runtime.registerLayer({
      id: "navigation",
      label: "Navigation",
    });
    first.unregister();
    runtime.registerLayer({ id: "navigation", label: "New navigation" });
    first.unregister();

    expect(runtime.listLayers()).toEqual([
      { id: "navigation", label: "New navigation" },
    ]);
  });

  it("records real events only while recording and generates identity and time", () => {
    let now = 100;
    const runtime = createTimelineRuntime({ now: () => now });
    runtime.emit({ layer: "navigation", type: "ignored", payload: null });
    runtime.startRecording();
    runtime.emit({
      layer: "navigation",
      type: "start",
      payload: { path: "/" },
    });
    now = 125;
    runtime.emit({ layer: "render", type: "commit", payload: { duration: 4 } });
    runtime.stopRecording();
    runtime.emit({ layer: "navigation", type: "ignored-again", payload: null });

    const snapshot = runtime.getSnapshot();
    expect(snapshot.data.recording).toBe(false);
    expect(snapshot.data.events).toEqual([
      {
        id: "ev_1",
        layer: "navigation",
        type: "start",
        payload: { path: "/" },
        timestampUnixMs: 100,
      },
      {
        id: "ev_2",
        layer: "render",
        type: "commit",
        payload: { duration: 4 },
        timestampUnixMs: 125,
      },
    ]);
  });

  it("supports silent ingestion with an explicit snapshot refresh", () => {
    const runtime = createTimelineRuntime();
    let notifications = 0;
    runtime.subscribe(() => notifications++);
    runtime.startRecording();
    const before = runtime.getSnapshot();

    runtime.emitSilently({
      layer: "react-render",
      type: "commit",
      payload: { rendererId: 1 },
    });

    expect(notifications).toBe(1);
    expect(runtime.getSnapshot()).toBe(before);
    runtime.refresh();
    expect(runtime.getSnapshot().data.events).toHaveLength(1);
    expect(runtime.getSnapshot().data.events[0]?.type).toBe("commit");
  });

  it("filters events and replaces snapshot arrays on revisions", () => {
    const runtime = createTimelineRuntime();
    runtime.startRecording();
    runtime.emit({
      layer: "navigation",
      type: "change",
      payload: 1,
      timestampUnixMs: 10,
    });
    runtime.emit({
      layer: "render",
      type: "commit",
      payload: 2,
      timestampUnixMs: 20,
    });
    const before = runtime.getSnapshot();

    runtime.setFilter({ layers: ["render"], sinceUnixMs: 15 });
    const after = runtime.getSnapshot();

    expect(after.revision).toBeGreaterThan(before.revision);
    expect(after.data.events).not.toBe(before.data.events);
    expect(after.data.events.map((event) => event.type)).toEqual(["commit"]);
  });

  it("evicts oldest events, reports drops, and clears retained events", () => {
    const runtime = createTimelineRuntime({ capacity: 2 });
    runtime.startRecording();
    runtime.emit({
      layer: "test",
      type: "one",
      payload: 1,
      timestampUnixMs: 1,
    });
    runtime.emit({
      layer: "test",
      type: "two",
      payload: 2,
      timestampUnixMs: 2,
    });
    runtime.emit({
      layer: "test",
      type: "three",
      payload: 3,
      timestampUnixMs: 3,
    });

    expect(
      runtime.getSnapshot().data.events.map((event) => event.type),
    ).toEqual(["two", "three"]);
    expect(runtime.getSnapshot().data.dropped).toBe(1);

    runtime.clear();
    expect(runtime.getSnapshot().data.events).toEqual([]);
  });

  it("notifies subscribers only until they detach", () => {
    const runtime = createTimelineRuntime();
    let notifications = 0;
    const unsubscribe = runtime.subscribe(() => notifications++);
    runtime.startRecording();
    runtime.stopRecording();
    unsubscribe();
    runtime.startRecording();

    expect(notifications).toBe(2);
  });
});
