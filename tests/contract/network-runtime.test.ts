import { describe, expect, it } from "vitest";
import {
  createNetworkRuntimeService,
  type NetworkPerformanceEntry,
  type PerformanceObserverFactory,
} from "@next-devtools/core";

function fakeObserver() {
  let callback:
    ((entries: readonly NetworkPerformanceEntry[]) => void) | undefined;
  let created = 0;
  let observed = 0;
  let disconnected = 0;
  const factory: PerformanceObserverFactory = (listener) => {
    callback = listener;
    created++;
    return {
      observe: () => {
        observed++;
      },
      disconnect: () => {
        disconnected++;
      },
    };
  };
  return {
    factory,
    emit: (entries: NetworkPerformanceEntry[]) => callback?.(entries),
    counts: () => ({ created, observed, disconnected }),
  };
}

const entry = (
  name: string,
  duration = 12,
  responseStatus?: number,
): NetworkPerformanceEntry => ({
  name,
  initiatorType: "fetch",
  ...(responseStatus === undefined ? {} : { responseStatus }),
  startTime: 4,
  duration,
  transferSize: 100,
  encodedBodySize: 80,
  decodedBodySize: 120,
});

describe("network runtime service", () => {
  it("captures resource timing metadata and redacts URL credentials and query values", () => {
    const observer = fakeObserver();
    const runtime = createNetworkRuntimeService({
      performanceObserverFactory: observer.factory,
      now: () => 50,
    });
    runtime.start();

    observer.emit([
      entry("https://user:secret@example.com/api?token=abc&item=42", 12, 204),
    ]);

    const captured = runtime.getSnapshot().data.entries[0]!;
    const url = new URL(captured.url);
    expect({ username: url.username, password: url.password }).toEqual({
      username: "",
      password: "",
    });
    expect([...url.searchParams.values()]).toEqual([
      "[redacted]",
      "[redacted]",
    ]);
    expect(captured).toEqual({
      id: "net_1",
      url: captured.url,
      initiatorType: "fetch",
      status: 204,
      startTime: 4,
      duration: 12,
      transferSize: 100,
      encodedBodySize: 80,
      decodedBodySize: 120,
      capturedAtUnixMs: 50,
    });
  });

  it("bounds retained entries and reports dropped count", () => {
    const observer = fakeObserver();
    const runtime = createNetworkRuntimeService({
      capacity: 2,
      performanceObserverFactory: observer.factory,
    });
    runtime.start();
    observer.emit([entry("/one"), entry("/two"), entry("/three")]);

    expect(runtime.getSnapshot().data.entries.map(({ url }) => url)).toEqual([
      "http://localhost/two",
      "http://localhost/three",
    ]);
    expect(runtime.getSnapshot().data.dropped).toBe(1);
  });

  it("does not retain credentials from malformed URLs", () => {
    const observer = fakeObserver();
    const runtime = createNetworkRuntimeService({
      performanceObserverFactory: observer.factory,
    });
    runtime.start();

    observer.emit([entry("http://user:secret@[invalid]?token=abc")]);

    expect(runtime.getSnapshot().data.entries[0]?.url).toBe("[invalid-url]");
  });

  it("starts idempotently and disconnects on stop", () => {
    const observer = fakeObserver();
    const runtime = createNetworkRuntimeService({
      performanceObserverFactory: observer.factory,
    });

    runtime.start();
    runtime.start();
    runtime.stop();
    runtime.stop();

    expect(observer.counts()).toEqual({
      created: 1,
      observed: 1,
      disconnected: 1,
    });
    expect(runtime.getSnapshot().data.recording).toBe(false);
  });

  it("clears entries and drop accounting", () => {
    const observer = fakeObserver();
    const runtime = createNetworkRuntimeService({
      capacity: 1,
      performanceObserverFactory: observer.factory,
    });
    runtime.start();
    observer.emit([entry("/one"), entry("/two")]);

    runtime.clear();

    expect(runtime.getSnapshot().data).toMatchObject({
      entries: [],
      dropped: 0,
    });
  });

  it("reports unsupported observers without patching fetch or XHR", () => {
    const originalFetch = globalThis.fetch;
    const runtime = createNetworkRuntimeService({
      performanceObserverFactory: null,
    });
    runtime.start();

    expect(runtime.getSnapshot()).toMatchObject({ status: "unavailable" });
    expect(globalThis.fetch).toBe(originalFetch);
  });
});
