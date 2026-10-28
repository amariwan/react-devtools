import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export const agentMcpPlugin: DevtoolsPlugin = {
  manifest: {
    id: "next-devtools.agent-mcp",
    version: "0.0.1",
    sdkRange: ">=0.0.0",
    displayName: "Agent / MCP",
    targets: ["node", "ui"],
    activation: "on-demand",
    permissions: ["server-diagnostics"],
  },
  setup(ctx) {
    ctx.panels.register({
      id: "agent-mcp",
      title: "Agent / MCP",
      icon: "agent",
      order: 50,
      load: async () => {
        const { default: Panel } = await import("./AgentMcpPanel.js");
        return { default: Panel };
      },
    });
  },
};

export default agentMcpPlugin;

export {
  createAgentMcpJsonLineHandler,
  createAgentMcpProtocolHandler,
} from "./agent-mcp-protocol.js";
export type {
  AgentMcpLineHandler,
  AgentMcpProtocolHandler,
  AgentMcpProtocolRequest,
  AgentMcpProtocolResponse,
} from "./agent-mcp-protocol.js";
