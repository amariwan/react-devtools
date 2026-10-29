import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { RouteRuntimeService } from "@next-devtools/host-next/route-runtime";
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PanelHeader,
  SearchField,
  StatusDot,
} from "@next-devtools/ui";
import { buildPagesData } from "./pages-data.js";

export default function PagesPanel({ registry }: { registry: PluginRegistry }) {
  const service = registry.services.get<RouteRuntimeService>(
    RUNTIME_SERVICE_IDS.routes,
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

  const data = React.useMemo(() => buildPagesData(snapshot), [snapshot]);
  const [query, setQuery] = React.useState("");
  const [parameterValues, setParameterValues] = React.useState<
    Record<string, Record<string, string>>
  >({});
  const visiblePages = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.pages;
    return data.pages.filter((page) =>
      `${page.urlPattern} ${page.fileRoles.join(" ")}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.pages, query]);

  const navigateToPage = React.useCallback(
    (
      path: string,
      values: Record<string, string>,
      dynamicParamNames: readonly string[],
      optionalParamNames: readonly string[],
    ) => {
      if (typeof window === "undefined") return;
      let target = path;
      for (const name of dynamicParamNames) {
        const rawValue = values[name] ?? "";
        const value = rawValue.trim();
        const catchAllToken = `[...${name}]`;
        const isOptional = optionalParamNames.includes(name);
        const encoded = target.includes(catchAllToken)
          ? value
            ? value.split("/").filter(Boolean).map(encodeURIComponent).join("/")
            : ""
          : encodeURIComponent(value);
        if (isOptional && !value) {
          target = target.replace(`/${catchAllToken}`, "");
        } else {
          target = target
            .replace(catchAllToken, encoded)
            .replace(`[${name}]`, encoded);
        }
      }
      if (target.includes("[")) return;
      window.history.pushState({}, "", target);
      service?.setLocation(window.location.href);
    },
    [service],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <PanelHeader
        title="Pages / Router"
        description={`${data.segmentCount} segments · ${data.pageCount} pages`}
        actions={<StatusDot status={data.status} />}
      />
      <div
        style={{
          fontSize: 12,
          color: "var(--muted-foreground)",
          overflowWrap: "anywhere",
        }}
      >
        Current route{" "}
        <code style={{ color: "var(--foreground)" }}>
          {data.activePathname}
        </code>
      </div>
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Search routes…"
        aria-label="Route search"
      />
      {data.pages.length === 0 ? (
        <EmptyState
          title="No routes discovered"
          description={
            data.reason ??
            "Route data is unavailable. Ensure withNextDevtools() is configured."
          }
        />
      ) : visiblePages.length === 0 ? (
        <EmptyState
          title="No matching routes"
          description="Change the route search to see discovered pages."
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
          }}
        >
          {visiblePages.map((page) => {
            const values = parameterValues[page.id] ?? {};
            const navigable = page.dynamicParamNames.every(
              (name) =>
                page.optionalParamNames.includes(name) ||
                Boolean(values[name]?.trim()),
            );
            return (
              <li
                key={page.id}
                aria-current={
                  page.urlPattern === data.activePathname ? "page" : undefined
                }
                style={{
                  background:
                    page.urlPattern === data.activePathname
                      ? "var(--accent)"
                      : "var(--card)",
                  fontSize: 12,
                  padding: "6px 8px",
                  border: "1px solid var(--border, #e4e4e7)",
                  borderRadius: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    overflowWrap: "anywhere",
                    minWidth: 0,
                  }}
                >
                  {page.urlPattern}{" "}
                  {page.urlPattern === data.activePathname ? (
                    <Badge variant="secondary">Active</Badge>
                  ) : null}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {page.dynamicParamNames.map((name) => (
                    <Input
                      key={name}
                      aria-label={`Route parameter ${name} for ${page.urlPattern}`}
                      value={values[name] ?? ""}
                      onChange={(event) =>
                        setParameterValues((current) => ({
                          ...current,
                          [page.id]: {
                            ...(current[page.id] ?? {}),
                            [name]: event.target.value,
                          },
                        }))
                      }
                      placeholder={name}
                      style={{ width: 90, fontSize: 11, padding: "3px 5px" }}
                    />
                  ))}
                  <span style={{ color: "var(--muted-foreground, #71717a)" }}>
                    {page.fileRoles.join(", ")}
                    {page.execution ? ` · ${page.execution}` : ""}
                  </span>
                  <Button
                    type="button"
                    onClick={() =>
                      navigateToPage(
                        page.urlPattern,
                        values,
                        page.dynamicParamNames,
                        page.optionalParamNames,
                      )
                    }
                    disabled={!navigable}
                    title={
                      navigable
                        ? `Navigate to ${page.urlPattern}`
                        : "Enter route parameters first"
                    }
                  >
                    Navigate
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
