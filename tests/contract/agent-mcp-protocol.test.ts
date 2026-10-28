import { describe, expect, it } from "vitest";
import {
  createAgentMcpJsonLineHandler,
  createAgentMcpProtocolHandler,
} from "../../plugins/agent-mcp/src/agent-mcp-protocol";
import type { AgentMcpToolSurface } from "../../plugins/agent-mcp/src/agent-mcp-tools";

function surface(
  call: AgentMcpToolSurface["call"] = async () => ({
    ok: true,
    data: { healthy: true },
  }),
): AgentMcpToolSurface {
  return {
    listTools: () => [],
    call,
    callUnknown: async () => ({ ok: false, code: "invalid-input", reason: "" }),
  };
}

describe("agent MCP protocol boundary", () => {
  it("enforces session ownership and validates bounded requests", async () => {
    const handler = createAgentMcpProtocolHandler(surface(), {
      timeoutMs: 20,
    });
    expect(handler.openSession("session-a", "owner-a")).toBe(true);
    expect(handler.openSession("session-a", "owner-b")).toBe(false);

    await expect(
      handler.handle({
        id: "1",
        sessionId: "session-a",
        ownerId: "owner-b",
        tool: "runtime-health",
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "unauthorized" },
    });
    await expect(
      handler.handle({
        id: "2",
        sessionId: "session-a",
        ownerId: "owner-a",
        tool: "timeline",
        input: { limit: 101 },
      }),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid-input" },
    });
  });

  it("returns successful results and enforces a timeout", async () => {
    const handler = createAgentMcpProtocolHandler(surface(), {
      timeoutMs: 10,
    });
    handler.openSession("session-a", "owner-a");
    await expect(
      handler.handle({
        id: "ok",
        sessionId: "session-a",
        ownerId: "owner-a",
        tool: "runtime-health",
      }),
    ).resolves.toMatchObject({
      id: "ok",
      ok: true,
      result: { ok: true },
    });

    const slow = createAgentMcpProtocolHandler(
      surface(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, data: {} }), 30),
          ),
      ),
      { timeoutMs: 5 },
    );
    slow.openSession("session-a", "owner-a");
    await expect(
      slow.handle({
        id: "slow",
        sessionId: "session-a",
        ownerId: "owner-a",
        tool: "runtime-health",
      }),
    ).resolves.toMatchObject({
      id: "slow",
      ok: false,
      error: { code: "timeout" },
    });
  });

  it("adapts newline-delimited JSON with a bounded message size", async () => {
    const protocol = createAgentMcpProtocolHandler(surface());
    protocol.openSession("session-a", "owner-a");
    const line = createAgentMcpJsonLineHandler(protocol, {
      maxLineLength: 1024,
    });
    await expect(line("not-json")).resolves.toContain(
      '"code":"invalid-request"',
    );
    await expect(line("x".repeat(1025))).resolves.toContain("maximum size");
    const response = JSON.parse(
      await line(
        JSON.stringify({
          id: "line-1",
          sessionId: "session-a",
          ownerId: "owner-a",
          tool: "runtime-health",
        }),
      ),
    ) as { id: string; ok: boolean };
    expect(response).toMatchObject({ id: "line-1", ok: true });
  });

  it("rejects non-object and unknown-field requests before dispatch", async () => {
    const calls: unknown[] = [];
    const handler = createAgentMcpProtocolHandler(
      surface(async (...args) => {
        calls.push(args);
        return { ok: true, data: {} };
      }),
    );
    handler.openSession("session-a", "owner-a");

    await expect(
      handler.handle("not-an-object" as never),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid-request" },
    });
    await expect(
      handler.handle({
        id: "extra",
        sessionId: "session-a",
        ownerId: "owner-a",
        tool: "runtime-health",
        extra: "ignored",
      } as never),
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid-request" },
    });
    expect(calls).toHaveLength(0);
  });
});
