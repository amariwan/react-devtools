import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import {
  Atom,
  Bug,
  CheckCircle2,
  Component,
  FileText,
  Lightbulb,
  Map as MapIcon,
  Settings2,
  Star,
  TriangleAlert,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  StatusDot,
  resolveIcon,
} from "@next-devtools/ui";
import { buildOverviewData } from "./overview-data.js";

const REPO_URL = "https://github.com/amariwan/react-devtools";

export default function OverviewPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const [, refresh] = React.useReducer((value) => value + 1, 0);
  React.useEffect(() => {
    const disposers = [
      registry.onChange(refresh),
      registry.panels.onChange(refresh),
      registry.capabilities.onChange(refresh),
      registry.services.subscribe(refresh),
    ];
    for (const id of Object.values(RUNTIME_SERVICE_IDS)) {
      const service = registry.services.get<{
        subscribe(listener: () => void): () => void;
      }>(id);
      if (service) disposers.push(service.subscribe(refresh));
    }
    return () => disposers.forEach((dispose) => dispose());
  }, [registry]);

  const data = buildOverviewData(registry);
  const connected = data.connectionStatus === "connected";

  const reactService = registry.services.get<{
    getSnapshot(): { data: { tree: { length: number } } };
  }>(RUNTIME_SERVICE_IDS.react);
  let componentCount: number;
  try {
    componentCount = reactService?.getSnapshot().data.tree.length ?? 0;
  } catch {
    componentCount = 0;
  }

  const routeService = registry.services.get<{
    getSnapshot(): { data: { tree: { nodes: { fileRoles: string[] }[] } } };
  }>(RUNTIME_SERVICE_IDS.routes);
  let pageCount: number;
  try {
    pageCount =
      routeService?.getSnapshot().data.tree.nodes.filter((node) =>
        node.fileRoles.includes("page"),
      ).length ?? 0;
  } catch {
    pageCount = 0;
  }

  const panels = registry.panels
    .list()
    .filter((panel) => panel.id !== "overview");

  const issues = [
    ...data.health.failedPlugins.map((plugin) => ({
      title: `Plugin failed: ${plugin.id}`,
      detail: plugin.message,
    })),
    ...data.health.unavailableServices.map((id) => ({
      title: `Service unavailable: ${id}`,
      detail: "Runtime service is not registered.",
    })),
    ...data.health.errorServices.map((id) => ({
      title: `Service error: ${id}`,
      detail: "The service could not provide its current snapshot.",
    })),
  ];

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return (
    <div className="devtools:flex devtools:h-full devtools:w-full devtools:flex-col devtools:items-center devtools:justify-center devtools:gap-12 devtools:px-6 devtools:py-10">
      {/* Centered header */}
      <div className="devtools:flex devtools:flex-col devtools:items-center devtools:gap-4">
        <ReactLogo className="devtools:h-16 devtools:w-auto" />
        <h1 className="devtools:text-2xl devtools:font-bold devtools:tracking-tight devtools:text-foreground">
          React DevTools
        </h1>
        <div className="devtools:flex devtools:items-center devtools:gap-1.5 devtools:text-xs devtools:text-muted-foreground">
          <span className="devtools:opacity-70">React DevTools</span>
          <code className="devtools:opacity-70">dev</code>
        </div>
        <StatusDot
          status={connected ? "available" : "unavailable"}
          label={connected ? "Connected" : "Disconnected"}
        />
      </div>

      {/* Three information cards */}
      <div className="devtools:flex devtools:flex-wrap devtools:items-stretch devtools:justify-center devtools:gap-6">
        <SummaryCard
          icon={Atom}
          label="Framework"
          value="React"
          hint="connected"
        />
        <SummaryCard
          icon={FileText}
          label="Pages"
          value={pageCount}
          hint={pageCount === 1 ? "route" : "routes"}
        />
        <SummaryCard
          icon={Component}
          label="Components"
          value={componentCount}
          hint={componentCount === 1 ? "node" : "nodes"}
        />
      </div>

      {/* Quick links */}
      <div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:justify-center devtools:gap-8">
        <QuickLink icon={Star} label="Star on GitHub" href={REPO_URL} />
        <QuickLink
          icon={Lightbulb}
          label="Ideas & Suggestions"
          href={`${REPO_URL}/discussions`}
        />
        <QuickLink
          icon={MapIcon}
          label="Project Roadmap"
          href={`${REPO_URL}/blob/main/ROADMAP.md`}
        />
        <QuickLink
          icon={Bug}
          label="Bug Reports"
          href={`${REPO_URL}/issues`}
        />
        <QuickLink
          icon={Settings2}
          label="Settings"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("next-devtools:navigate", { detail: "settings" }),
            )
          }
        />
      </div>

      {/* Health issues */}
      {issues.length > 0 && (
        <div className="devtools:w-full devtools:max-w-xl devtools:space-y-2">
          {issues.map((issue) => (
            <div
              key={issue.title}
              role="alert"
              className="devtools:flex devtools:gap-2 devtools:rounded-md devtools:border devtools:border-destructive/30 devtools:bg-destructive/10 devtools:p-3 devtools:text-left devtools:text-xs"
            >
              <TriangleAlert
                aria-hidden
                className="devtools:size-4 devtools:shrink-0 devtools:text-destructive"
              />
              <div className="devtools:min-w-0 devtools:break-words">
                <strong>{issue.title}</strong>
                <p className="devtools:mt-1 devtools:text-muted-foreground">
                  {issue.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && (
        <p className="devtools:flex devtools:items-center devtools:justify-center devtools:gap-2 devtools:text-xs devtools:text-muted-foreground">
          <CheckCircle2
            aria-hidden
            className="devtools:size-4 devtools:text-success"
          />
          All registered plugins and runtime services are healthy.
        </p>
      )}

      {/* Inspect your application */}
      {panels.length > 0 && (
        <div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:justify-center devtools:gap-2">
          {panels.map((panel) => {
            const Icon = resolveIcon(panel.icon);
            return (
              <Button
                key={panel.id}
                variant="outline"
                size="sm"
                className="devtools:gap-1.5"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("next-devtools:navigate", {
                      detail: panel.id,
                    }),
                  )
                }
              >
                <Icon aria-hidden className="devtools:size-4" />
                {panel.title}
              </Button>
            );
          })}
        </div>
      )}

      {/* Keyboard shortcuts */}
      <div className="devtools:flex devtools:flex-col devtools:items-center devtools:gap-1 devtools:text-xs devtools:text-muted-foreground">
        <div className="devtools:flex devtools:items-center devtools:gap-1.5">
          <span className="devtools:opacity-60">Press</span>
          <kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
            {isMac ? "⌘ Command" : "Ctrl"}
          </kbd>
          <span className="devtools:opacity-60">+</span>
          <kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
            K
          </kbd>
          <span className="devtools:opacity-60">to toggle Command Palette</span>
        </div>
        <div className="devtools:flex devtools:items-center devtools:gap-1.5">
          <span className="devtools:opacity-60">Press</span>
          <kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
            {isMac ? "⇧ Shift" : "Shift"}
          </kbd>
          <span className="devtools:opacity-60">+</span>
          <kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
            {isMac ? "⌥ Option" : "Alt"}
          </kbd>
          <span className="devtools:opacity-60">+</span>
          <kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
            D
          </kbd>
          <span className="devtools:opacity-60">to toggle DevTools</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="devtools:min-w-[140px] devtools:items-center devtools:px-6 devtools:py-5 devtools:shadow-sm devtools:transition-colors devtools:motion-reduce:transition-none devtools:hover:bg-muted/40">
      <CardContent className="devtools:flex devtools:flex-col devtools:items-center devtools:gap-1.5 devtools:p-0">
        {Icon && (
          <Icon
            aria-hidden
            className="devtools:size-5 devtools:text-muted-foreground"
          />
        )}
        <span className="devtools:text-2xl devtools:font-semibold devtools:tabular-nums devtools:text-foreground">
          {value}
        </span>
        <span className="devtools:text-[11px] devtools:font-medium devtools:uppercase devtools:tracking-wide devtools:text-muted-foreground">
          {label}
        </span>
        {hint && (
          <Badge variant="secondary" className="devtools:text-[10px]">
            {hint}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function QuickLink({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "devtools:inline-flex devtools:items-center devtools:gap-1.5 devtools:text-xs devtools:text-muted-foreground devtools:opacity-70 devtools:transition-all devtools:motion-reduce:transition-none devtools:hover:opacity-100 devtools:hover:text-foreground";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        <Icon aria-hidden className="devtools:size-3.5" />
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon aria-hidden className="devtools:size-3.5" />
      {label}
    </button>
  );
}

function ReactLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="React"
    >
      <circle cx="12" cy="12" r="2" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="1" fill="none">
        <ellipse cx="12" cy="12" rx="11" ry="4.2" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)" />
      </g>
    </svg>
  );
}
