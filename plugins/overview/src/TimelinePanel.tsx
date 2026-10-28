import * as React from "react";
import {
  compareProfilerInsights,
  buildProfilerInsights,
  captureDebugSession,
  compareDebugSessions,
  type PluginRegistry,
  type DebugSession,
  type ProfilerInsights,
} from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { TimelineRuntime } from "@next-devtools/core";
import { EmptyState } from "@next-devtools/ui";
import { buildTimelineData } from "./timeline-data.js";
import {
  DEBUG_SESSION_SHARING_KEY,
  loadDebugSessions,
  SHARED_DEBUG_SESSION_STORAGE_KEY,
  saveDebugSessions,
} from "./debug-session-storage.js";

function formatPayload(payload: unknown): string {
  try {
    const value = JSON.stringify(payload);
    return value === undefined ? String(payload) : value;
  } catch {
    return "[unserializable payload]";
  }
}

export default function TimelinePanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const service = registry.services.get<TimelineRuntime>(
    RUNTIME_SERVICE_IDS.timeline,
  );
  const [, setPollTick] = React.useState(0);
  React.useEffect(() => {
    if (!service) return;
    const interval = window.setInterval(() => {
      service.refresh();
      setPollTick((tick) => tick + 1);
    }, 250);
    return () => window.clearInterval(interval);
  }, [service]);
  const subscribe = React.useMemo(
    () => (listener: () => void) =>
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
  const data = React.useMemo(() => buildTimelineData(snapshot), [snapshot]);
  const profiler = React.useMemo(
    () => buildProfilerInsights(data.events),
    [data.events],
  );
  const [baseline, setBaseline] = React.useState<ProfilerInsights | null>(null);
  const comparison = React.useMemo(
    () => (baseline ? compareProfilerInsights(baseline, profiler) : null),
    [baseline, profiler],
  );
  const [shareDebugSessions, setShareDebugSessions] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(DEBUG_SESSION_SHARING_KEY) === "1",
  );
  const [debugSessions, setDebugSessions] = React.useState<DebugSession[]>(() =>
    loadDebugSessions(
      typeof window === "undefined"
        ? undefined
        : window.localStorage.getItem(DEBUG_SESSION_SHARING_KEY) === "1"
          ? window.localStorage
          : window.sessionStorage,
      typeof window !== "undefined" &&
        window.localStorage.getItem(DEBUG_SESSION_SHARING_KEY) === "1"
        ? SHARED_DEBUG_SESSION_STORAGE_KEY
        : undefined,
    ),
  );
  const debugSessionStorage =
    typeof window === "undefined"
      ? undefined
      : shareDebugSessions
        ? window.localStorage
        : window.sessionStorage;
  const debugSessionStorageKey = shareDebugSessions
    ? SHARED_DEBUG_SESSION_STORAGE_KEY
    : undefined;
  React.useEffect(() => {
    saveDebugSessions(
      debugSessionStorage,
      debugSessions,
      debugSessionStorageKey,
    );
  }, [debugSessionStorage, debugSessionStorageKey, debugSessions]);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      DEBUG_SESSION_SHARING_KEY,
      shareDebugSessions ? "1" : "0",
    );
    const sharedStorage = window.localStorage;
    if (!shareDebugSessions) return;
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== sharedStorage) return;
      if (event.key !== SHARED_DEBUG_SESSION_STORAGE_KEY) return;
      setDebugSessions(
        loadDebugSessions(sharedStorage, SHARED_DEBUG_SESSION_STORAGE_KEY),
      );
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [shareDebugSessions]);

  const toggleSharedSessions = (enabled: boolean) => {
    const target =
      typeof window === "undefined"
        ? undefined
        : enabled
          ? window.localStorage
          : window.sessionStorage;
    setDebugSessions(
      loadDebugSessions(
        target,
        enabled ? SHARED_DEBUG_SESSION_STORAGE_KEY : undefined,
      ),
    );
    setShareDebugSessions(enabled);
  };
  const debugComparison = React.useMemo(
    () =>
      debugSessions.length >= 2
        ? compareDebugSessions(
            debugSessions[debugSessions.length - 2]!,
            debugSessions[debugSessions.length - 1]!,
          )
        : null,
    [debugSessions],
  );
  const [layerFilter, setLayerFilter] = React.useState(
    () => snapshot?.data.filter.layers?.[0] ?? "",
  );
  const layers = React.useMemo(() => {
    const names = new Set(service?.listLayers().map((layer) => layer.id) ?? []);
    for (const event of data.events) names.add(event.layer);
    return [...names].sort();
  }, [service, data.events]);

  const updateLayerFilter = (value: string) => {
    setLayerFilter(value);
    service?.setFilter(value ? { layers: [value] } : {});
  };

  const captureSession = () => {
    const network = registry.services.get<{
      getSnapshot(): { data: { entries: readonly unknown[] } };
    }>(RUNTIME_SERVICE_IDS.network);
    const diagnostics = registry.services.get<{
      getSnapshot(): { data: { events: readonly unknown[] } };
    }>(RUNTIME_SERVICE_IDS.diagnostics);
    const captured = captureDebugSession({
      sessionId: `debug_${Date.now()}`,
      capturedAtUnixMs: Date.now(),
      timeline: data.events,
      network: network?.getSnapshot().data.entries as never,
      diagnostics: diagnostics?.getSnapshot().data.events as never,
      limit: 200,
    });
    setDebugSessions((sessions) => [...sessions, captured].slice(-2));
  };

  const exportLatestSession = () => {
    const latest = debugSessions.at(-1);
    if (!latest || typeof document === "undefined") return;
    const blob = new Blob([JSON.stringify(latest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${latest.sessionId}.json`;
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
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Timeline</h2>
        <span style={{ fontSize: 11, color: "var(--muted, #71717a)" }}>
          {data.recording ? "recording" : "stopped"} · {data.count} events
          {data.dropped ? ` · ${data.dropped} dropped` : ""}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted, #71717a)", margin: 0 }}>
        Bounded runtime events from registered DevTools layers. React commit
        profiling is not inferred from this stream.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ fontSize: 12 }}>
          <span style={{ marginRight: 6 }}>Layer</span>
          <select
            aria-label="Timeline layer filter"
            value={layerFilter}
            onChange={(event) => updateLayerFilter(event.target.value)}
          >
            <option value="">All layers</option>
            {layers.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => service?.startRecording()}>
          Start recording
        </button>
        <button type="button" onClick={() => service?.stopRecording()}>
          Stop recording
        </button>
        <button type="button" onClick={() => service?.clear()}>
          Clear
        </button>
        <button type="button" onClick={() => setBaseline(profiler)}>
          Capture profiler baseline
        </button>
        {baseline && (
          <button type="button" onClick={() => setBaseline(null)}>
            Clear baseline
          </button>
        )}
      </div>
      <section
        style={{
          border: "1px solid var(--border, #e4e4e7)",
          borderRadius: 6,
          padding: 10,
        }}
      >
        <h3 style={{ fontSize: 13, margin: "0 0 6px" }}>Debug sessions</h3>
        <p
          style={{
            fontSize: 11,
            color: "var(--muted, #71717a)",
            margin: "0 0 8px",
          }}
        >
          Capture bounded, sanitized evidence from the current runtime view and
          compare the two most recent captures.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 12, display: "flex", gap: 5 }}>
            <input
              type="checkbox"
              checked={shareDebugSessions}
              onChange={(event) => toggleSharedSessions(event.target.checked)}
            />
            Share across tabs
          </label>
          <button type="button" onClick={captureSession}>
            Capture debug session
          </button>
          <button
            type="button"
            onClick={exportLatestSession}
            disabled={debugSessions.length === 0}
          >
            Export latest session
          </button>
          <button
            type="button"
            onClick={() => setDebugSessions([])}
            disabled={debugSessions.length === 0}
          >
            Clear sessions
          </button>
        </div>
        <div style={{ fontSize: 11, marginTop: 8 }}>
          {debugSessions.length} debug session
          {debugSessions.length === 1 ? "" : "s"} captured
        </div>
        {debugComparison && (
          <p style={{ fontSize: 11, margin: "6px 0 0" }}>
            Debug session comparison:{" "}
            {debugComparison.timelineDelta >= 0 ? "+" : ""}
            {debugComparison.timelineDelta} timeline events ·{" "}
            {debugComparison.networkDelta >= 0 ? "+" : ""}
            {debugComparison.networkDelta} network entries ·{" "}
            {debugComparison.diagnosticsDelta >= 0 ? "+" : ""}
            {debugComparison.diagnosticsDelta} diagnostics
          </p>
        )}
      </section>
      {data.events.length === 0 ? (
        <EmptyState
          title={
            data.status === "available"
              ? "No timeline events"
              : "Timeline unavailable"
          }
          description={
            data.reason ??
            "Events appear when a registered layer emits while recording."
          }
        />
      ) : (
        <>
          {comparison && (
            <section
              style={{
                border: "1px solid var(--border, #e4e4e7)",
                borderRadius: 6,
                padding: 10,
              }}
            >
              <h3 style={{ fontSize: 13, margin: "0 0 6px" }}>
                Profiler · before / after
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted, #71717a)",
                  margin: "0 0 8px",
                }}
              >
                Measured difference from the captured baseline; no render cause
                is inferred. {comparison.totalCommitDelta >= 0 ? "+" : ""}
                {comparison.totalCommitDelta} commits ·{" "}
                {comparison.totalActualDurationDelta >= 0 ? "+" : ""}
                {comparison.totalActualDurationDelta.toFixed(2)} ms actual
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11 }}>
                {comparison.ranked.slice(0, 10).map((rank) => (
                  <li key={rank.id}>
                    <span style={{ fontFamily: "monospace" }}>{rank.id}</span> ·{" "}
                    {rank.status} · {rank.commitDelta >= 0 ? "+" : ""}
                    {rank.commitDelta} commits ·{" "}
                    {rank.actualDurationDelta >= 0 ? "+" : ""}
                    {rank.actualDurationDelta.toFixed(2)} ms
                  </li>
                ))}
              </ul>
            </section>
          )}
          {profiler.commits.length > 0 && (
            <>
              <section
                style={{
                  border: "1px solid var(--border, #e4e4e7)",
                  borderRadius: 6,
                  padding: 10,
                }}
              >
                <h3 style={{ fontSize: 13, margin: "0 0 6px" }}>
                  React Profiler · ranked renders
                </h3>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted, #71717a)",
                    margin: "0 0 8px",
                  }}
                >
                  {profiler.commits.length} commits ·{" "}
                  {profiler.totalActualDuration.toFixed(2)} ms actual · max{" "}
                  {profiler.maxActualDuration.toFixed(2)} ms
                </p>
                <ol style={{ margin: 0, paddingLeft: 20, fontSize: 11 }}>
                  {profiler.ranked.slice(0, 10).map((rank) => (
                    <li key={rank.id}>
                      <span style={{ fontFamily: "monospace" }}>{rank.id}</span>{" "}
                      · {rank.commits} commits ·{" "}
                      {rank.totalActualDuration.toFixed(2)} ms total ·{" "}
                      {rank.averageActualDuration.toFixed(2)} ms avg
                    </li>
                  ))}
                </ol>
              </section>
              <section
                aria-label="Recent React profiler commits"
                style={{
                  border: "1px solid var(--border, #e4e4e7)",
                  borderRadius: 6,
                  padding: 10,
                }}
              >
                <h3 style={{ fontSize: 13, margin: "0 0 6px" }}>
                  Recent measured commits
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 11 }}>
                  {[...profiler.commits]
                    .reverse()
                    .slice(0, 10)
                    .map((commit) => (
                      <li key={commit.eventId}>
                        <span style={{ fontFamily: "monospace" }}>
                          {commit.id}
                        </span>{" "}
                        · {commit.phase} · {commit.actualDuration.toFixed(2)} ms
                        actual · {commit.baseDuration.toFixed(2)} ms base
                      </li>
                    ))}
                </ul>
              </section>
            </>
          )}
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
            {[...data.events].reverse().map((event) => (
              <li
                key={event.id}
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
                <span style={{ fontFamily: "monospace" }}>
                  {event.layer} · {event.type}
                </span>
                <span style={{ color: "var(--muted, #71717a)" }}>
                  {new Date(event.timestampUnixMs).toLocaleTimeString()} ·{" "}
                  {formatPayload(event.payload)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
