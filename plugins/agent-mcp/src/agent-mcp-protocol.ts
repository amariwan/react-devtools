import type {
  AgentMcpToolResult,
  AgentMcpToolSurface,
} from "./agent-mcp-tools.js";
import {
  isAgentMcpToolName,
  validateAgentMcpInput,
} from "./agent-mcp-tools.js";

export type AgentMcpProtocolRequest = {
  readonly id: string;
  readonly sessionId: string;
  readonly ownerId: string;
  readonly tool: unknown;
  readonly input?: unknown;
};

export type AgentMcpProtocolResponse =
  | {
      readonly id: string;
      readonly ok: true;
      readonly result: AgentMcpToolResult;
    }
  | {
      readonly id: string;
      readonly ok: false;
      readonly error: {
        readonly code:
          "invalid-request" | "unauthorized" | "invalid-input" | "timeout";
        readonly reason: string;
      };
    };

export interface AgentMcpProtocolHandler {
  openSession(sessionId: string, ownerId: string): boolean;
  closeSession(sessionId: string, ownerId: string): boolean;
  handle(request: AgentMcpProtocolRequest): Promise<AgentMcpProtocolResponse>;
}

export type AgentMcpLineHandler = (line: string) => Promise<string>;

function protocolError(
  id: string,
  code: Extract<AgentMcpProtocolResponse, { ok: false }>["error"]["code"],
  reason: string,
): AgentMcpProtocolResponse {
  return { id, ok: false, error: { code, reason } };
}

function validToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createAgentMcpProtocolHandler(
  surface: AgentMcpToolSurface,
  options: { timeoutMs?: number } = {},
): AgentMcpProtocolHandler {
  const sessions = new Map<string, string>();
  const timeoutMs = Math.min(5000, Math.max(1, options.timeoutMs ?? 1000));

  return {
    openSession(sessionId, ownerId) {
      if (!validToken(sessionId) || !validToken(ownerId)) return false;
      const currentOwner = sessions.get(sessionId);
      if (currentOwner !== undefined && currentOwner !== ownerId) return false;
      sessions.set(sessionId, ownerId);
      return true;
    },
    closeSession(sessionId, ownerId) {
      if (sessions.get(sessionId) !== ownerId) return false;
      sessions.delete(sessionId);
      return true;
    },
    async handle(request) {
      const candidate = request as unknown;
      const id =
        isRecord(candidate) && typeof candidate.id === "string"
          ? candidate.id
          : "invalid";
      if (
        !isRecord(candidate) ||
        Object.keys(candidate).some(
          (key) =>
            !["id", "sessionId", "ownerId", "tool", "input"].includes(key),
        ) ||
        !validToken(candidate.id) ||
        !validToken(candidate.sessionId) ||
        !validToken(candidate.ownerId) ||
        !isAgentMcpToolName(candidate.tool)
      ) {
        return protocolError(id, "invalid-request", "Invalid MCP request");
      }
      if (sessions.get(candidate.sessionId) !== candidate.ownerId) {
        return protocolError(id, "unauthorized", "Session owner mismatch");
      }
      const validation = validateAgentMcpInput(candidate.tool, candidate.input);
      if (!validation.ok)
        return protocolError(id, "invalid-input", validation.reason);
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          surface.call(candidate.tool, validation.value),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
          }),
        ]);
        return { id, ok: true, result };
      } catch (error) {
        if (error instanceof Error && error.message === "timeout")
          return protocolError(id, "timeout", "Tool execution timed out");
        return protocolError(id, "invalid-request", "Tool execution failed");
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
  };
}

/**
 * Adapt the protocol to newline-delimited JSON without opening a transport.
 * A caller may attach this handler to stdio, a worker port, or another local
 * IPC channel after applying its own process-level authorization.
 */
export function createAgentMcpJsonLineHandler(
  handler: AgentMcpProtocolHandler,
  options: { maxLineLength?: number } = {},
): AgentMcpLineHandler {
  const maxLineLength = Math.max(1024, options.maxLineLength ?? 65536);
  return async (line) => {
    const invalid = (reason: string) =>
      JSON.stringify({
        id: "invalid",
        ok: false,
        error: { code: "invalid-request", reason },
      } satisfies AgentMcpProtocolResponse);
    if (typeof line !== "string" || line.length > maxLineLength)
      return invalid("JSON line exceeds the maximum size");
    let request: unknown;
    try {
      request = JSON.parse(line);
    } catch {
      return invalid("Malformed JSON request");
    }
    try {
      return JSON.stringify(
        await handler.handle(request as AgentMcpProtocolRequest),
      );
    } catch {
      return invalid("Unable to serialize protocol response");
    }
  };
}
