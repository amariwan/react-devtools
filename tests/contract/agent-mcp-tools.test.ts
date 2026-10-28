import { describe, expect, it } from "vitest";
import { createAgentMcpToolSurface } from "../../plugins/agent-mcp/src/agent-mcp-tools";

describe("agent MCP read-only tool surface", () => {
  it("declares read-only bounded tools and limits timeline output", async () => {
    const registry = {
      list: () => [],
      capabilities: { list: () => [] },
      services: {
        get: (id: string) =>
          id.endsWith("timeline")
            ? {
                getSnapshot: () => ({
                  status: "available",
                  revision: 1,
                  data: {
                    events: Array.from({ length: 120 }, (_, index) => ({
                      id: index,
                    })),
                  },
                }),
              }
            : undefined,
      },
    } as never;
    const surface = createAgentMcpToolSurface(registry);

    expect(surface.listTools().every((tool) => tool.safety === "read")).toBe(
      true,
    );
    const result = await surface.call("timeline", { limit: 3 });
    expect(result).toMatchObject({ ok: true });
    expect(
      (result as { data: { data: { events: unknown[] } } }).data.data.events,
    ).toHaveLength(3);
  });

  it("rejects component detail requests without an id", async () => {
    const surface = createAgentMcpToolSurface({
      services: { get: () => undefined },
      list: () => [],
      capabilities: { list: () => [] },
    } as never);
    await expect(surface.call("component-detail", {})).resolves.toEqual({
      ok: false,
      code: "invalid-input",
      reason: "A component id is required",
    });
  });

  it("bounds network requests and exposes only the selected store snapshot", async () => {
    const registry = {
      list: () => [],
      capabilities: { list: () => [] },
      services: {
        get: (id: string) => {
          if (id.endsWith("network"))
            return {
              getSnapshot: () => ({
                status: "available",
                revision: 1,
                data: {
                  recording: true,
                  entries: Array.from({ length: 120 }, (_, index) => ({
                    id: `net_${index}`,
                  })),
                  dropped: 0,
                },
              }),
            };
          if (id.endsWith("stores"))
            return {
              getSnapshot: () => ({
                status: "available",
                revision: 2,
                data: {
                  adapters: [],
                  selectedAdapterId: "redux:default",
                  canMutate: false,
                  loading: false,
                  value: { __ndt_type: "object", entries: [] },
                },
              }),
            };
          if (id.endsWith("diagnostics"))
            return {
              getSnapshot: () => ({
                status: "available",
                revision: 3,
                data: {
                  events: [{ id: "diag_1", message: "boom" }],
                  dropped: 0,
                },
              }),
            };
          return undefined;
        },
      },
    } as never;
    const surface = createAgentMcpToolSurface(registry);
    const network = await surface.call("network-requests", { limit: 4 });
    expect(network).toMatchObject({ ok: true });
    expect(
      (network as { data: { data: { entries: unknown[] } } }).data.data.entries,
    ).toHaveLength(4);
    await expect(surface.call("inspect-store")).resolves.toMatchObject({
      ok: true,
      data: { data: { selectedAdapterId: "redux:default" } },
    });
    const exported = await surface.call("export-debug-session", { limit: 2 });
    expect(exported).toMatchObject({
      ok: true,
      data: {
        timeline: { status: "unavailable" },
        network: {
          data: { entries: [{ id: "net_118" }, { id: "net_119" }] },
        },
        store: { data: { selectedAdapterId: "redux:default" } },
        errors: { data: { events: [{ id: "diag_1" }] } },
      },
    });
  });

  it("rejects untrusted tool names at runtime", async () => {
    const surface = createAgentMcpToolSurface({
      services: { get: () => undefined },
      list: () => [],
      capabilities: { list: () => [] },
    } as never);
    await expect(surface.callUnknown("write-files", {})).resolves.toEqual({
      ok: false,
      code: "invalid-input",
      reason: "Unknown read-only tool",
    });
  });
});
