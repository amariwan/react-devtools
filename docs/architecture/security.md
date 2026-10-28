# Security model

Trust boundaries are explicit: inspected application/runtime, DevTools browser
UI, Next development server, local filesystem/editor process, and optional
agent/MCP consumer.

The browser cannot submit trusted editor roots. The server validates origin and
host, canonicalizes paths, rejects traversal and symlink escapes, and selects
executables from the registered VS Code/Cursor allowlist. Editor commands use
argument arrays and are denied outside development.

Runtime values are depth-, key-, array-, string-, and cycle-bounded. Network
metadata is redacted and bounded. Plugin permissions describe intended access;
the registry still isolates lifecycle and resource ownership.

## Threat model and abuse cases

| Boundary / threat                                                               | Control                                                                                                                                                                 | Evidence                                                                                                                        | Residual risk                                                                                                               |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Browser UI attempts to override editor roots or escape through a symlink        | Roots are server-owned; paths are canonicalized and checked against every trusted root                                                                                  | `tests/compatibility/open-in-editor.test.ts`, `tests/contract/source-inspector.test.ts`                                         | The developer server is still a local privileged process and must not be exposed publicly                                   |
| Editor request selects an arbitrary executable or injects shell syntax          | Fixed VS Code/Cursor mapping, argument-array spawning, no shell interpolation                                                                                           | `tests/contract/source-inspector.test.ts`, `tests/compatibility/open-in-editor-executable.test.ts`                              | OS-level executable replacement and user workstation compromise are outside this package                                    |
| Malicious runtime values exhaust memory or leak credentials                     | Depth/key/array/string/cycle bounds, URL credential/query redaction, bounded buffers                                                                                    | `tests/contract/value-codec.test.ts`, `tests/contract/network-runtime.test.ts`, `tests/contract/timeline-runtime.test.ts`       | Application-specific secrets can still appear in explicitly inspected values; do not treat read access as a secret boundary |
| Failed or stale plugin activation retains privileged resources                  | Owned registrations roll back on setup failure; disposal is idempotent and generation-safe                                                                              | `tests/contract/plugin-runtime.test.ts`                                                                                         | Concurrent third-party plugin code remains application code and must be reviewed before installation                        |
| Agent/MCP caller impersonates a session or sends an oversized/malformed request | Read-only tool allowlist, session-owner binding, bounded schemas, strict request shape, 5-second timeout, bounded JSON lines, and sequential caller-owned stdio adapter | `tests/contract/agent-mcp-protocol.test.ts`, `tests/contract/agent-mcp-tools.test.ts`, `tests/contract/agent-mcp-stdio.test.ts` | The adapter does not authorize a process or expose IPC; the host transport must add local process/origin authorization      |
| Runtime text is treated as agent instructions                                   | Protocol returns structured evidence only; no shell, filesystem, editor, or state-write tool exists                                                                     | `plugins/agent-mcp/src/agent-mcp-tools.ts`, `docs/features/ai-mcp.md`                                                           | A downstream agent must still label runtime strings as untrusted data and keep its own prompt-injection defenses            |
| DevTools remains active in production                                           | Client guard and server editor action deny production execution                                                                                                         | `packages/next/src/config.test.ts`, `tests/compatibility/open-in-editor.test.ts`                                                | A misconfigured custom host can bypass package assumptions; production smoke coverage remains a release check               |

Evidence is in the listed contract/compatibility tests. MCP is optional/read-only
and is not a general shell, filesystem, editor, network, or state-mutation bridge.
The JSON-line adapter and stdio adapter do not authorize a process or expose an
IPC endpoint. Any host using them must perform its own local authorization
before forwarding requests; the browser panel does not open the transport.
