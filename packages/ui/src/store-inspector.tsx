import * as React from "react";
import type { EncodedValue } from "@next-devtools/contracts";
import { childrenOf, summarizeValue } from "./value-format.js";

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

function ValueTree({ value }: { value: EncodedValue }) {
  const budget = { remaining: 200 };

  function renderValue(
    current: EncodedValue,
    path: string,
    depth: number,
  ): React.ReactNode {
    if (budget.remaining-- <= 0)
      return (
        <span style={{ color: "var(--muted, #71717a)" }}>
          … value tree truncated
        </span>
      );
    const summary = summarizeValue(current);
    const children = depth < 6 ? childrenOf(current) : [];
    if (!summary.expandable || children.length === 0) {
      return <span>{summary.label}</span>;
    }
    return (
      <details open={depth === 0}>
        <summary style={{ cursor: "pointer" }}>{summary.label}</summary>
        <div style={{ paddingLeft: 14 }}>
          {children.map((child) => (
            <div
              key={`${path}.${child.key}`}
              style={{ display: "flex", gap: 6 }}
            >
              <span style={{ color: "var(--muted, #71717a)" }}>
                {child.key}:
              </span>
              {renderValue(child.value, `${path}.${child.key}`, depth + 1)}
            </div>
          ))}
        </div>
      </details>
    );
  }

  return (
    <div
      aria-label="Store value"
      style={{
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.5,
        maxHeight: 280,
        overflow: "auto",
        padding: 6,
        border: "1px solid var(--border, #e4e4e7)",
        borderRadius: 4,
      }}
    >
      {renderValue(value, "$", 0)}
    </div>
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
  const summary = value === undefined ? null : summarizeValue(value);
  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 8,
        border: "1px solid var(--border, #e4e4e7)",
        borderRadius: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <label style={{ flex: 1, fontSize: 12 }}>
          <span
            style={{
              display: "block",
              color: "var(--muted, #71717a)",
              marginBottom: 3,
            }}
          >
            Adapter
          </span>
          <select
            aria-label="Store adapter"
            value={selectedAdapterId ?? ""}
            onChange={(event) => void onSelect(event.target.value)}
            disabled={adapters.length === 0 || loading}
            style={{
              width: "100%",
              padding: "4px 6px",
              background: "transparent",
              color: "inherit",
              border: "1px solid var(--border, #e4e4e7)",
              borderRadius: 4,
            }}
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
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={!selectedAdapterId || loading}
        >
          {loading ? "Reading…" : "Refresh"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
        Status: {status}
        {reason ? ` · ${reason}` : ""}
      </div>
      {summary ? (
        <>
          <div style={{ fontFamily: "monospace", fontSize: 12 }}>
            {summary.kind}: {summary.label}
          </div>
          <ValueTree value={value!} />
        </>
      ) : (
        <div style={{ fontFamily: "monospace", fontSize: 12 }}>
          No snapshot selected
        </div>
      )}
    </section>
  );
}
