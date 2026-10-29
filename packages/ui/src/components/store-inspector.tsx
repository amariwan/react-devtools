import * as React from "react";
import type { EncodedValue } from "@next-devtools/contracts";
import { Button } from "./ui/button";
import { EmptyState, SearchField, StatusDot } from "./primitives";
import { childrenOf, summarizeValue } from "../helpers/value-format.js";

export interface StoreInspectorProps {
  adapters: readonly { id: string; label: string }[];
  selectedAdapterId?: string | undefined;
  status?: string | undefined;
  loading?: boolean | undefined;
  reason?: string | undefined;
  value?: EncodedValue | undefined;
  onSelect: (id: string) => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}

/** Mount children only when expanded, with bounded batches for large snapshots. */
function ValueBranch({
  value,
  depth = 0,
}: {
  value: EncodedValue;
  depth?: number;
}) {
  const [open, setOpen] = React.useState(depth === 0);
  const [limit, setLimit] = React.useState(100);
  const summary = summarizeValue(value);
  const children = React.useMemo(
    () => (open && depth < 20 ? childrenOf(value) : []),
    [open, depth, value],
  );
  if (!summary.expandable)
    return (
      <span className="devtools:break-all devtools:text-foreground">
        {summary.label}
      </span>
    );
  if (depth >= 20)
    return (
      <span className="devtools:text-muted-foreground">
        {summary.label} · depth limit reached
      </span>
    );
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="devtools:cursor-pointer devtools:rounded devtools:py-1 devtools:break-all devtools:text-primary devtools:hover:bg-accent">
        {summary.label}
      </summary>
      {open && (
        <div className="devtools:ml-2 devtools:border-l devtools:border-border devtools:pl-3">
          {children.slice(0, limit).map((child) => (
            <div
              key={child.key}
              className="devtools:flex devtools:items-baseline devtools:gap-2 devtools:py-0.5"
            >
              <span className="devtools:max-w-[50%] devtools:shrink-0 devtools:break-all devtools:text-muted-foreground">
                {child.key}:
              </span>
              <div className="devtools:min-w-0 devtools:flex-1">
                <ValueBranch value={child.value} depth={depth + 1} />
              </div>
            </div>
          ))}
          {children.length > limit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLimit((value) => value + 100)}
            >
              Show next {Math.min(100, children.length - limit)} properties
            </Button>
          )}
        </div>
      )}
    </details>
  );
}

export function StoreInspector({
  adapters,
  selectedAdapterId,
  status = "unavailable",
  loading = false,
  reason,
  value,
  onSelect,
  onRefresh,
}: StoreInspectorProps) {
  const [query, setQuery] = React.useState("");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const id = React.useId();
  const properties = React.useMemo(
    () => (value === undefined ? [] : childrenOf(value)),
    [value],
  );
  const matches = properties.filter((property) =>
    property.key.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const perform = async (action: () => void | Promise<void>) => {
    setActionError(null);
    try {
      await action();
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Could not read this store. Try refreshing.",
      );
    }
  };
  return (
    <section
      aria-label="Store inspector"
      aria-busy={loading}
      className="devtools:space-y-3"
    >
      <div className="devtools:flex devtools:flex-wrap devtools:items-end devtools:gap-2">
        <label
          htmlFor={id}
          className="devtools:min-w-0 devtools:flex-1 devtools:text-xs devtools:text-muted-foreground"
        >
          Store adapter
          <select
            id={id}
            aria-label="Store adapter"
            value={selectedAdapterId ?? ""}
            disabled={!adapters.length || loading}
            onChange={(event) => {
              setQuery("");
              void perform(() => onSelect(event.target.value));
            }}
            className="devtools:mt-1 devtools:h-8 devtools:w-full devtools:rounded-md devtools:border devtools:border-input devtools:bg-background devtools:px-2 devtools:text-sm devtools:text-foreground"
          >
            <option value="" disabled>
              Select a store
            </option>
            {adapters.map((adapter) => (
              <option key={adapter.id} value={adapter.id}>
                {adapter.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void perform(onRefresh)}
          disabled={!selectedAdapterId || loading}
        >
          {loading ? "Reading…" : "Refresh"}
        </Button>
      </div>
      <div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2 devtools:text-xs devtools:text-muted-foreground">
        <StatusDot status={status} label={status} />
        {reason && <span>{reason}</span>}
      </div>
      {actionError && (
        <p role="alert" className="devtools:text-xs devtools:text-destructive">
          {actionError}
        </p>
      )}
      {value !== undefined ? (
        <>
          {properties.length > 0 && (
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Filter top-level properties…"
              aria-label="Filter store properties"
            />
          )}
          <div
            aria-label="Store value"
            className="devtools:max-h-[55dvh] devtools:overflow-auto devtools:rounded-md devtools:border devtools:border-border devtools:bg-card devtools:p-3 devtools:font-mono devtools:text-xs devtools:leading-relaxed"
          >
            {query.trim() ? (
              matches.length ? (
                matches.map((property) => (
                  <div
                    key={property.key}
                    className="devtools:flex devtools:gap-2 devtools:py-1"
                  >
                    <span className="devtools:break-all devtools:text-muted-foreground">
                      {property.key}:
                    </span>
                    <ValueBranch value={property.value} />
                  </div>
                ))
              ) : (
                <p>No properties match this filter.</p>
              )
            ) : (
              <ValueBranch key={selectedAdapterId} value={value} />
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title={loading ? "Reading store…" : "No snapshot selected"}
          description={
            loading
              ? "Waiting for the adapter to return its state."
              : "Choose a registered store adapter to inspect its current state."
          }
        />
      )}
    </section>
  );
}
