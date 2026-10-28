import { describe, expect, it } from "vitest";
import { buildAgentMcpHealthData } from "../../plugins/agent-mcp/src/agent-mcp-data";

describe("agent MCP health data", () => {
  it("exposes read-only plugin, capability, and service health", () => {
    const data = buildAgentMcpHealthData({
      list: () => [
        {
          plugin: { manifest: { id: "plugin.test" } },
          status: "error",
          error: new Error("setup failed"),
        },
      ],
      capabilities: { list: () => [{ id: "react.tree" }] },
      services: {
        get: (id: string) =>
          id.endsWith("timeline")
            ? {
                getSnapshot: () => ({
                  status: "available",
                  data: { dropped: 3 },
                  revision: 2,
                }),
              }
            : id.endsWith("react")
              ? {
                  getSnapshot: () => ({
                    status: "available",
                    data: {},
                    revision: 1,
                  }),
                }
              : undefined,
      },
    } as never);

    expect(data.plugins).toEqual([
      { id: "plugin.test", status: "error", reason: "setup failed" },
    ]);
    expect(data.capabilities).toEqual(["react.tree"]);
    expect(
      data.services.find((service) => service.id.endsWith("react")),
    ).toMatchObject({
      status: "available",
    });
    expect(
      data.services.find((service) => service.id.endsWith("timeline")),
    ).toMatchObject({ status: "available", droppedEvents: 3 });
    expect(
      data.services.find((service) => service.id.endsWith("routes")),
    ).toMatchObject({
      status: "unavailable",
    });
  });
});
