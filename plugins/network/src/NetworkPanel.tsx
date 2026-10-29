import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { NetworkRuntimeService } from "@next-devtools/core";
import {
  Badge,
  Button,
  EmptyState,
  PanelHeader,
  SearchField,
  Select,
  Toolbar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@next-devtools/ui";
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

  const resetFilters = () => {
    setQuery("");
    setInitiatorFilter("");
  };
  return (
    <div className="devtools:flex devtools:min-h-0 devtools:flex-col">
      <PanelHeader
        title="Network"
        description="Resource timing metadata. Full request details remain in browser DevTools."
        actions={
          <Badge variant={data.recording ? "default" : "secondary"}>
            {data.recording ? "Recording" : "Stopped"} · {data.count} requests
          </Badge>
        }
      />
      <Toolbar className="devtools:flex-wrap devtools:gap-2">
        <Button
          variant={data.recording ? "outline" : "default"}
          disabled={
            !service || data.status === "unavailable" || data.status === "error"
          }
          onClick={() => (data.recording ? service?.stop() : service?.start())}
        >
          {data.recording ? "Stop recording" : "Start recording"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => service?.clear()}
          disabled={data.count === 0}
        >
          Clear
        </Button>
        <Button
          variant="outline"
          onClick={exportEntries}
          disabled={visibleEntries.length === 0}
        >
          Export JSON
        </Button>
        <SearchField
          aria-label="Network request search"
          value={query}
          onChange={setQuery}
          placeholder="Filter requests by URL…"
        />
        <Select
          aria-label="Network initiator filter"
          value={initiatorFilter}
          onChange={setInitiatorFilter}
          options={[
            { value: "", label: "All types" },
            ...initiators.map((value) => ({ value, label: value })),
          ]}
        />
      </Toolbar>
      {(data.reason || data.dropped > 0) && (
        <p
          role="status"
          className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:text-muted-foreground"
        >
          {data.reason}
          {data.reason && data.dropped > 0 ? " · " : ""}
          {data.dropped > 0 ? `${data.dropped} older entries dropped` : ""}
        </p>
      )}
      {data.entries.length === 0 ? (
        <EmptyState
          title={
            data.status === "available"
              ? "No requests captured"
              : "Network capture unavailable"
          }
          description={
            data.reason ??
            (data.recording
              ? "Load a page or trigger a request to capture resource timings."
              : "Start recording, then trigger a request in your application.")
          }
        />
      ) : visibleEntries.length === 0 ? (
        <EmptyState
          title="No matching requests"
          description="Change the URL search or resource type filter."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="devtools:overflow-auto">
          <Table className="devtools:table-fixed devtools:min-w-[560px]">
            <TableHeader>
              <TableRow>
                <TableHead className="devtools:w-[45%]">Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="devtools:text-right">Duration</TableHead>
                <TableHead className="devtools:text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEntries.map((entry) => {
                const expanded = expandedId === entry.id;
                return (
                  <React.Fragment key={entry.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          aria-expanded={expanded}
                          onClick={() =>
                            setExpandedId(expanded ? null : entry.id)
                          }
                          className="devtools:w-full devtools:justify-start devtools:font-mono devtools:text-xs"
                          title={entry.url}
                        >
                          <span className="devtools:truncate">{entry.url}</span>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.status !== undefined && entry.status >= 400
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {entry.status ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="devtools:text-xs devtools:text-muted-foreground">
                        {entry.initiatorType}
                      </TableCell>
                      <TableCell className="devtools:text-right devtools:font-mono devtools:text-xs devtools:tabular-nums">
                        {Math.round(entry.duration)} ms
                      </TableCell>
                      <TableCell className="devtools:text-right devtools:font-mono devtools:text-xs devtools:tabular-nums">
                        {entry.transferSize} B
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={5} className="devtools:bg-muted/30">
                          <dl className="devtools:grid devtools:grid-cols-[auto_1fr] devtools:gap-x-4 devtools:gap-y-2 devtools:px-2 devtools:py-1 devtools:text-xs">
                            <dt className="devtools:text-muted-foreground">
                              URL
                            </dt>
                            <dd className="devtools:break-all devtools:font-mono">
                              {entry.url}
                            </dd>
                            <dt className="devtools:text-muted-foreground">
                              Start time
                            </dt>
                            <dd>{entry.startTime.toFixed(2)} ms</dd>
                            <dt className="devtools:text-muted-foreground">
                              Captured
                            </dt>
                            <dd>
                              {new Date(
                                entry.capturedAtUnixMs,
                              ).toLocaleString()}
                            </dd>
                            <dt className="devtools:text-muted-foreground">
                              Encoded / decoded
                            </dt>
                            <dd>
                              {entry.encodedBodySize} B /{" "}
                              {entry.decodedBodySize} B
                            </dd>
                          </dl>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
