import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { NetworkRuntimeService } from "@next-devtools/core";
import { EmptyState } from "@next-devtools/ui";
import { buildNetworkData } from "./network-data.js";

export default function NetworkPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const service = registry.services.get<NetworkRuntimeService>(
    RUNTIME_SERVICE_IDS.network,
  );
  const subscribe = React.useMemo(
    () =>
      (listener: () => void): (() => void) =>
        service?.subscribe(listener) ?? (() => undefined),
    [service],
  );
  const getSnapshot = React.useMemo(
    () => () => service?.getSnapshot() ?? null,
    [service],
  );
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const data = React.useMemo(() => buildNetworkData(snapshot), [snapshot]);
  const [query, setQuery] = React.useState("");
  const [initiatorFilter, setInitiatorFilter] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const initiators = React.useMemo(
    () => [...new Set(data.entries.map((entry) => entry.initiatorType))].sort(),
    [data.entries],
  );
  const visibleEntries = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return data.entries.filter((entry) => {
      if (initiatorFilter && entry.initiatorType !== initiatorFilter)
        return false;
      return (
        !normalizedQuery || entry.url.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [data.entries, initiatorFilter, query]);

  const exportEntries = () => {
    if (typeof document === "undefined") return;
    const blob = new Blob([JSON.stringify(visibleEntries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "next-devtools-network.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Network</h2>
        <span style={{ fontSize: 11, color: "var(--muted, #71717a)" }}>
          {data.recording ? "recording" : "stopped"} · {data.count} entries
          {data.dropped ? ` · ${data.dropped} dropped` : ""}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted, #71717a)", margin: 0 }}>
        Fetch/XHR metadata with sensitive headers redacted. Browser Network tab
        remains source for full data.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={() => service?.start()}>
          Start recording
        </button>
        <button type="button" onClick={() => service?.stop()}>
          Stop recording
        </button>
        <button type="button" onClick={() => service?.clear()}>
          Clear
        </button>
        <button
          type="button"
          onClick={exportEntries}
          disabled={visibleEntries.length === 0}
        >
          Export JSON
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Search</span>
          <input
            aria-label="Network request search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="URL…"
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Initiator</span>
          <select
            aria-label="Network initiator filter"
            value={initiatorFilter}
            onChange={(event) => setInitiatorFilter(event.target.value)}
          >
            <option value="">All</option>
            {initiators.map((initiator) => (
              <option key={initiator} value={initiator}>
                {initiator}
              </option>
            ))}
          </select>
        </label>
      </div>
      {data.entries.length === 0 ? (
        <EmptyState
          title={
            data.status === "available"
              ? "No network entries captured"
              : "Network capture unavailable"
          }
          description={
            data.reason ?? "Entries appear once resources are loaded."
          }
        />
      ) : visibleEntries.length === 0 ? (
        <EmptyState
          title="No matching network entries"
          description="Change the search or initiator filter to see captured entries."
        />
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxHeight: 420,
            overflow: "auto",
          }}
        >
          {visibleEntries.map((entry) => {
            const expanded = expandedId === entry.id;
            return (
              <li
                key={entry.id}
                style={{
                  fontSize: 11,
                  padding: "6px 8px",
                  border: "1px solid var(--border, #e4e4e7)",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  style={{
                    textAlign: "left",
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.url}
                </button>
                <span style={{ color: "var(--muted, #71717a)" }}>
                  {entry.initiatorType}
                  {entry.status !== undefined
                    ? ` · ${entry.status}`
                    : ""} · {Math.round(entry.duration)}ms ·{" "}
                  {entry.transferSize}B
                </span>
                {expanded && (
                  <dl
                    style={{
                      margin: "4px 0 0",
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "2px 8px",
                    }}
                  >
                    <dt>Start</dt>
                    <dd style={{ margin: 0 }}>
                      {entry.startTime.toFixed(2)}ms
                    </dd>
                    <dt>Captured</dt>
                    <dd style={{ margin: 0 }}>{entry.capturedAtUnixMs}</dd>
                    <dt>Encoded</dt>
                    <dd style={{ margin: 0 }}>{entry.encodedBodySize}B</dd>
                    <dt>Decoded</dt>
                    <dd style={{ margin: 0 }}>{entry.decodedBodySize}B</dd>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
