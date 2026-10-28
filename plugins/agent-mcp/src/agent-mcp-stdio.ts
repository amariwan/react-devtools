import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { AgentMcpLineHandler } from "./agent-mcp-protocol.js";

export interface AgentMcpStdioOptions {
  readonly input: Readable;
  readonly output: Writable;
  readonly signal?: AbortSignal;
}

function waitForDrain(output: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      output.removeListener("drain", onDrain);
      output.removeListener("error", onError);
    };
    output.once("drain", onDrain);
    output.once("error", onError);
  });
}

/**
 * Serve newline-delimited protocol requests over caller-owned stdio streams.
 * This adapter never spawns a process or chooses a transport endpoint. The
 * caller must authorize the local process before handing streams to it.
 */
export async function runAgentMcpStdio(
  lineHandler: AgentMcpLineHandler,
  options: AgentMcpStdioOptions,
): Promise<void> {
  const reader = createInterface({
    input: options.input,
    crlfDelay: Infinity,
  });
  const abort = () => reader.close();
  options.signal?.addEventListener("abort", abort, { once: true });
  try {
    for await (const line of reader) {
      if (options.signal?.aborted) break;
      const response = await lineHandler(line);
      if (!options.output.write(`${response}\n`))
        await waitForDrain(options.output);
    }
  } finally {
    options.signal?.removeEventListener("abort", abort);
    reader.close();
  }
}
