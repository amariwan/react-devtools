import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  createAgentMcpJsonLineHandler,
  createAgentMcpProtocolHandler,
} from "../../plugins/agent-mcp/src/agent-mcp-protocol";
import { runAgentMcpStdio } from "../../plugins/agent-mcp/src/agent-mcp-stdio";
import type { AgentMcpToolSurface } from "../../plugins/agent-mcp/src/agent-mcp-tools";

function surface(): AgentMcpToolSurface {
  return {
    listTools: () => [],
    call: async () => ({ ok: true, data: { healthy: true } }),
    callUnknown: async () => ({ ok: false, code: "invalid-input", reason: "" }),
  };
}

describe("agent MCP stdio transport", () => {
  it("processes authorized protocol lines sequentially without spawning", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    output.on("data", (chunk: Buffer) => chunks.push(chunk));
    const protocol = createAgentMcpProtocolHandler(surface());
    protocol.openSession("session-a", "owner-a");
    const run = runAgentMcpStdio(createAgentMcpJsonLineHandler(protocol), {
      input,
      output,
    });
    input.end(
      `${JSON.stringify({
        id: "stdio-1",
        sessionId: "session-a",
        ownerId: "owner-a",
        tool: "runtime-health",
      })}\n`,
    );
    await run;

    const response = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
      id: string;
      ok: boolean;
    };
    expect(response).toMatchObject({ id: "stdio-1", ok: true });
  });

  it("stops before forwarding lines after abort", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const controller = new AbortController();
    const protocol = createAgentMcpProtocolHandler(surface());
    protocol.openSession("session-a", "owner-a");
    const run = runAgentMcpStdio(createAgentMcpJsonLineHandler(protocol), {
      input,
      output,
      signal: controller.signal,
    });
    controller.abort();
    input.end(
      `${JSON.stringify({
        id: "stdio-aborted",
        sessionId: "session-a",
        ownerId: "owner-a",
        tool: "runtime-health",
      })}\n`,
    );
    await run;
    expect(output.read()).toBeNull();
  });
});
