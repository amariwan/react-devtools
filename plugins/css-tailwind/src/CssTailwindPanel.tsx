import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import {
  Badge,
  Button,
  EmptyState,
  PanelHeader,
  SearchField,
  Toolbar,
} from "@next-devtools/ui";
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

  const [query, setQuery] = React.useState("");
  const tokens = data.tokens.filter((token) =>
    token.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div className="devtools:flex devtools:min-h-0 devtools:flex-col">
      <PanelHeader
        title="CSS / Tailwind"
        description="Custom properties from readable stylesheets. Cross-origin sheets are excluded."
        actions={
          <Button variant="outline" onClick={() => setSnapshot(collectCss())}>
            Refresh
          </Button>
        }
      />
      <Toolbar className="devtools:flex-wrap devtools:gap-2">
        <SearchField
          aria-label="Search CSS tokens"
          placeholder="Search custom properties…"
          value={query}
          onChange={setQuery}
        />
        <Badge variant="secondary">{data.tokens.length} tokens</Badge>
        <Badge variant="outline">{data.ruleCount} rules</Badge>
        <Badge variant="outline">
          Tailwind {data.tailwindDetected ? "detected" : "not detected"}
        </Badge>
      </Toolbar>
      {data.tokens.length === 0 ? (
        <EmptyState
          title="No custom properties found"
          description="Load application styles, then refresh to scan accessible stylesheets."
          action={
            <Button variant="outline" onClick={() => setSnapshot(collectCss())}>
              Refresh stylesheets
            </Button>
          }
        />
      ) : tokens.length === 0 ? (
        <EmptyState
          title="No matching properties"
          description="Try another token name."
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="devtools:m-0 devtools:list-none devtools:divide-y devtools:divide-border devtools:p-0">
          {tokens.map((token) => (
            <li
              key={token}
              className="devtools:px-3 devtools:py-2 devtools:font-mono devtools:text-xs devtools:break-all devtools:hover:bg-muted/50"
            >
              {token}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
