import { describe, expect, it } from "vitest";
import { createSessionRegistry } from "@next-devtools/core";

const session = (
  sessionId: string,
  connectedAtUnixMs: number,
  lastSeenUnixMs = connectedAtUnixMs,
) => ({
  sessionId,
  connectedAtUnixMs,
  lastSeenUnixMs,
  stale: false,
});

describe("session runtime", () => {
  it("orders snapshots by connection time and selects the first session", () => {
    const registry = createSessionRegistry();
    registry.register(session("later", 20));
    registry.register(session("earlier", 10));

    expect(
      registry.getSnapshot().data.sessions.map(({ sessionId }) => sessionId),
    ).toEqual(["earlier", "later"]);
    expect(registry.getSnapshot().data.activeSessionId).toBe("later");
  });

  it("updates heartbeat state from an explicit clock value", () => {
    const registry = createSessionRegistry();
    registry.register({ ...session("app", 10), stale: true });

    registry.touch("app", 42);

    expect(registry.get("app")).toMatchObject({
      lastSeenUnixMs: 42,
      stale: false,
    });
  });

  it("marks and deterministically prunes stale sessions", () => {
    const registry = createSessionRegistry({ staleAfterMs: 50 });
    registry.register(session("old", 0, 10));
    registry.register(session("fresh", 20, 80));
    registry.markStale("fresh");

    expect(registry.get("fresh")?.stale).toBe(true);
    expect(registry.pruneStale(100)).toEqual(["old", "fresh"]);
    expect(registry.list()).toEqual([]);
  });

  it("selects the next connected non-stale session after active removal", () => {
    const registry = createSessionRegistry();
    registry.register(session("first", 10));
    registry.register({ ...session("stale", 20), stale: true });
    registry.register(session("next", 30));
    registry.setActive("first");

    registry.remove("first");

    expect(registry.active()?.sessionId).toBe("next");
  });

  it("stops notifying a detached subscriber", () => {
    const registry = createSessionRegistry();
    let notifications = 0;
    const unsubscribe = registry.subscribe(() => notifications++);
    registry.register(session("one", 1));
    registry.setActive("one");
    unsubscribe();
    registry.touch("one", 2);

    expect(notifications).toBe(1);
  });
});
