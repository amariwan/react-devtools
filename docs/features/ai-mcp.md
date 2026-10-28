# Agent and MCP

The Agent/MCP plugin is optional and read-only in the current workspace. Its
declared read-only tool surface covers runtime health, app sessions, plugins,
components, routes, timeline, sanitized network requests, selected store
snapshots, profiler summary, and bounded debug-session export. The panel exposes the
current plugin, capability, and runtime-service snapshot, including failed
plugin reasons and dropped-event counts, while deliberately not exposing an
unrestricted transport.

The package now contains a transport-neutral protocol boundary and JSON-line
adapter with explicit request/response types, strict request-object shape
validation, session-owner checks, bounded input/message validation, and
timeouts. The `@next-devtools/plugin-agent-mcp/stdio` subpath also provides a
sequential stdio adapter over caller-owned Node streams. It does not spawn a
process, choose an endpoint, or bypass the protocol boundary; the host must
authorize the local process before handing it streams.

`export-debug-session` includes the same bounded session record used by the
Timeline panel: timeline events, sanitized network metadata, normalized
diagnostics, and measured profiler insights. It is evidence, not an inferred
root cause.

Any future MCP implementation must use bounded schemas, capability checks,
runtime tool-name validation, timeouts, session ownership, and explicit action permissions. Runtime values
are untrusted data and must never become instructions for an agent. Editor
opening, state mutation, process execution, and filesystem access require
separate authorization and are not part of the current read-only surface.
