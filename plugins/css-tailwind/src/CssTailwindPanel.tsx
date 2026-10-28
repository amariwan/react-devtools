import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { EmptyState } from "@next-devtools/ui";
import { buildCssData, type CssHostSnapshot } from "./css-data.js";

function collectCss(): CssHostSnapshot {
  const stylesheets: string[] = [];
  if (typeof document === "undefined") return { stylesheets };
  const sheets = Array.from(document.styleSheets ?? []);
  for (const sheet of sheets) {
    try {
      const rules = Array.from(sheet.cssRules ?? []);
      stylesheets.push(rules.map((r) => r.cssText).join("\n"));
    } catch {
      // Cross-origin stylesheets cannot be read; skip.
    }
  }
  // Also include inline style tags.
  const styleTags = Array.from(document.querySelectorAll("style"));
  for (const tag of styleTags) {
    if (tag.textContent) stylesheets.push(tag.textContent);
  }
  return { stylesheets };
}

export default function CssTailwindPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  void registry;
  const [snapshot, setSnapshot] = React.useState<CssHostSnapshot>(() => ({
    stylesheets: [],
  }));

  React.useEffect(() => {
    setSnapshot(collectCss());
  }, []);

  const data = React.useMemo(() => buildCssData(snapshot), [snapshot]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
        CSS / Tailwind
      </h2>
      <p style={{ fontSize: 13, color: "var(--muted, #71717a)", margin: 0 }}>
        Tokens and Tailwind detection from accessible stylesheets.
      </p>
      <div style={{ fontSize: 12, color: "var(--muted, #71717a)" }}>
        Tailwind: {data.tailwindDetected ? "detected" : "not detected"} ·{" "}
        {data.ruleCount} rules · {data.tokens.length} custom properties
      </div>
      {data.tokens.length === 0 ? (
        <EmptyState
          title="No CSS custom properties found"
          description="Accessible stylesheets contained no --* tokens."
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
          {data.tokens.map((token) => (
            <li
              key={token}
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                padding: "4px 8px",
                border: "1px solid var(--border, #e4e4e7)",
                borderRadius: 4,
              }}
            >
              {token}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
