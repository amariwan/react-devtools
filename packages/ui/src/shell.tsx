"use client";

import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type {
  CommandDescriptor,
  PanelDescriptor,
} from "@next-devtools/plugin-sdk";
import {
  CodeIcon,
  MoonIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { cn } from "./lib/utils";
import { fuzzyFilter } from "./fuzzy";
import { clamp } from "./geometry";
import { resolveIcon } from "./panel-icon";
import {
  EmptyState,
  ErrorState,
  IconButton,
  PanelHeader,
  Select,
  type SelectOption,
  SettingsRow,
  Switch,
} from "./primitives";
import {
  defaultPrefs,
  loadPrefs,
  resolveEffectiveTheme,
  savePrefs,
  type DockPosition,
  type ShellPrefs,
  type ThemePref,
} from "./prefs";
import { pickActivePanelId, resolveShellShortcut } from "./shell-affordances";
import {
  buildUniversalSearchEntries,
  type UniversalSearchEntry,
  type UniversalSearchSnapshots,
} from "./universal-search";

export interface DevtoolsShellProps {
  registry: PluginRegistry;
  enabled?: boolean;
}

const DOCK_OPTIONS: SelectOption[] = [
  { value: "bottom", label: "Bottom" },
  { value: "right", label: "Right" },
  { value: "left", label: "Left" },
];

const THEME_OPTIONS: SelectOption[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type PaletteEntry =
  | { kind: "panel" | "command"; id: string; title: string; subtitle?: string }
  | (Omit<UniversalSearchEntry, "kind"> & { kind: "runtime" });

export function DevtoolsShell({
  registry,
  enabled = true,
}: DevtoolsShellProps) {
  const [open, setOpen] = React.useState(false);
  const [activePanelId, setActivePanelId] = React.useState<string | null>(null);
  const [panels, setPanels] = React.useState<PanelDescriptor[]>([]);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pluginRevision, setPluginRevision] = React.useState(0);
  const [, setRuntimeRevision] = React.useState(0);
  const [size, setSize] = React.useState(420);
  const [systemDark, setSystemDark] = React.useState(false);
  const [prefs, setPrefs] = React.useState<ShellPrefs>(() =>
    typeof window === "undefined"
      ? defaultPrefs()
      : loadPrefs(window.localStorage),
  );

  // Live panel list from the registry.
  React.useEffect(() => {
    if (!enabled) return;
    const unsub = registry.panels.onChange((p) => setPanels([...p]));
    setPanels([...registry.panels.list()]);
    return unsub;
  }, [registry, enabled]);

  React.useEffect(() => {
    if (!enabled) return;
    const refresh = () => setRuntimeRevision((revision) => revision + 1);
    const disposers = [registry.services.subscribe(refresh)];
    for (const id of [
      "next-devtools.runtime.react",
      "next-devtools.runtime.routes",
      "next-devtools.runtime.timeline",
      "next-devtools.runtime.network",
      "next-devtools.runtime.diagnostics",
    ]) {
      const service = registry.services.get<{
        subscribe(listener: () => void): () => void;
      }>(id);
      if (service) disposers.push(service.subscribe(refresh));
    }
    refresh();
    return () => disposers.forEach((dispose) => dispose());
  }, [registry, enabled]);

  // Track the OS color scheme for the `system` theme option.
  React.useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const update = () => setSystemDark(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const effectiveTheme = resolveEffectiveTheme(prefs.theme, systemDark);

  React.useEffect(() => {
    if (typeof window !== "undefined") savePrefs(window.localStorage, prefs);
  }, [prefs]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = resolveShellShortcut({
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        open,
        overlayOpen: cmdOpen || settingsOpen,
      });
      if (action === null) return;
      if (action !== "close-overlays" && action !== "close-devtools") {
        e.preventDefault();
      }
      switch (action) {
        case "open-devtools":
          setOpen(true);
          break;
        case "toggle-palette":
          setCmdOpen((value) => !value);
          break;
        case "close-overlays":
          setCmdOpen(false);
          setSettingsOpen(false);
          break;
        case "close-devtools":
          setOpen(false);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, cmdOpen, settingsOpen]);

  const visiblePanels = panels.filter(
    (p) => !prefs.hiddenPanels.includes(p.id),
  );

  React.useEffect(() => {
    if (!open) return;
    setActivePanelId((current) => pickActivePanelId(visiblePanels, current));
  }, [open, visiblePanels]);

  if (!enabled) return null;

  const activePanel = visiblePanels.find((p) => p.id === activePanelId) ?? null;
  const commands = registry.commands.list();
  const snapshotFor = (id: string): unknown =>
    registry.services
      .get<{
        getSnapshot(): { data: unknown };
      }>(id)
      ?.getSnapshot().data;
  const reactSnapshot = snapshotFor(RUNTIME_SERVICE_IDS.react) as
    UniversalSearchSnapshots["react"] | undefined;
  const routeSnapshot = snapshotFor(RUNTIME_SERVICE_IDS.routes) as
    UniversalSearchSnapshots["routes"] | undefined;
  const networkSnapshot = snapshotFor(RUNTIME_SERVICE_IDS.network) as
    UniversalSearchSnapshots["network"] | undefined;
  const diagnosticsSnapshot = snapshotFor(RUNTIME_SERVICE_IDS.diagnostics) as
    UniversalSearchSnapshots["diagnostics"] | undefined;
  const runtimeSnapshots: UniversalSearchSnapshots = {
    timeline: registry.timeline.getSnapshot().data,
    ...(reactSnapshot ? { react: reactSnapshot } : {}),
    ...(routeSnapshot ? { routes: routeSnapshot } : {}),
    ...(networkSnapshot ? { network: networkSnapshot } : {}),
    ...(diagnosticsSnapshot ? { diagnostics: diagnosticsSnapshot } : {}),
  };
  const runtimeSearchEntries = buildUniversalSearchEntries(runtimeSnapshots);
  const registeredPlugins = React.useMemo(
    () => registry.list(),
    [registry, pluginRevision],
  );

  const setTheme = (theme: ThemePref) => setPrefs((p) => ({ ...p, theme }));
  const setDock = (dock: DockPosition) => setPrefs((p) => ({ ...p, dock }));
  const togglePanel = (id: string) =>
    setPrefs((p) => ({
      ...p,
      hiddenPanels: p.hiddenPanels.includes(id)
        ? p.hiddenPanels.filter((x) => x !== id)
        : [...p.hiddenPanels, id],
    }));

  const selectPanel = (id: string) => {
    setActivePanelId(id);
    setSettingsOpen(false);
    setCmdOpen(false);
  };

  const activatePlugin = async (id: string) => {
    await registry.activate(id);
    setPluginRevision((revision) => revision + 1);
  };

  return (
    <div
      data-theme={effectiveTheme}
      className="devtools:font-sans devtools:text-sm devtools:text-foreground"
    >
      {!open ? (
        <button
          type="button"
          aria-label="Open Next.js DevTools"
          title="Next.js DevTools (Ctrl/Cmd+K)"
          onClick={() => setOpen(true)}
          className="devtools:fixed devtools:right-4 devtools:bottom-4 devtools:z-[2147483647] devtools:flex devtools:size-11 devtools:items-center devtools:justify-center devtools:rounded-full devtools:border devtools:border-border devtools:bg-background devtools:text-foreground devtools:shadow-lg devtools:transition-transform devtools:hover:scale-105"
        >
          <CodeIcon className="devtools:size-5" aria-hidden />
        </button>
      ) : (
        <Dock dock={prefs.dock} size={size} onResize={setSize}>
          <div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-1 devtools:border-b devtools:border-border devtools:bg-muted/40 devtools:px-2 devtools:py-1.5">
            <span className="devtools:px-1 devtools:text-xs devtools:font-semibold devtools:text-foreground">
              Next.js DevTools
            </span>
            <div className="devtools:ml-auto devtools:flex devtools:items-center devtools:gap-1">
              <IconButton
                icon={SearchIcon}
                label="Search panels and commands"
                onClick={() => setCmdOpen(true)}
              />
              <IconButton
                icon={effectiveTheme === "dark" ? SunIcon : MoonIcon}
                label={
                  effectiveTheme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
                onClick={() =>
                  setTheme(effectiveTheme === "dark" ? "light" : "dark")
                }
              />
              <IconButton
                icon={SettingsIcon}
                label="Settings"
                onClick={() => setSettingsOpen((v) => !v)}
              />
              <IconButton
                icon={XIcon}
                label="Close"
                onClick={() => setOpen(false)}
              />
            </div>
          </div>

          <div className="devtools:flex devtools:min-h-0 devtools:flex-1">
            <nav
              aria-label="Panels"
              role="tablist"
              aria-orientation="vertical"
              className="devtools:flex devtools:w-12 devtools:shrink-0 devtools:flex-col devtools:gap-1 devtools:overflow-y-auto devtools:border-r devtools:border-border devtools:bg-muted/40 devtools:p-1.5"
            >
              {visiblePanels.map((p) => {
                const Icon = resolveIcon(p.icon);
                const active = p.id === activePanelId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    title={p.title}
                    aria-label={p.title}
                    aria-selected={active}
                    aria-controls="devtools-panel-view"
                    tabIndex={active ? 0 : -1}
                    onClick={() => selectPanel(p.id)}
                    className={cn(
                      "devtools:flex devtools:size-9 devtools:items-center devtools:justify-center devtools:rounded-md devtools:text-muted-foreground devtools:transition-colors devtools:hover:bg-accent devtools:hover:text-accent-foreground",
                      active &&
                        "devtools:bg-primary devtools:text-primary-foreground devtools:hover:bg-primary devtools:hover:text-primary-foreground",
                    )}
                  >
                    <Icon className="devtools:size-4" aria-hidden />
                  </button>
                );
              })}
            </nav>

            <main
              id="devtools-panel-view"
              role="tabpanel"
              className="devtools:min-w-0 devtools:flex-1 devtools:overflow-auto"
            >
              {settingsOpen ? (
                <SettingsView
                  prefs={prefs}
                  panels={visiblePanels}
                  plugins={registeredPlugins}
                  onThemeChange={setTheme}
                  onDockChange={setDock}
                  onTogglePanel={togglePanel}
                  onActivatePlugin={activatePlugin}
                />
              ) : activePanel ? (
                <PanelView registry={registry} panel={activePanel} />
              ) : (
                <EmptyState
                  title="No panel selected"
                  description="Choose a panel from the sidebar."
                />
              )}
            </main>
          </div>
        </Dock>
      )}

      {cmdOpen ? (
        <CommandPalette
          panels={visiblePanels}
          commands={commands}
          runtimeEntries={runtimeSearchEntries}
          onSelectPanel={selectPanel}
          onClose={() => setCmdOpen(false)}
        />
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- Dock */

function Dock({
  dock,
  size,
  onResize,
  children,
}: {
  dock: DockPosition;
  size: number;
  onResize: (n: number) => void;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties =
    dock === "bottom"
      ? { left: 0, right: 0, bottom: 0, height: size }
      : dock === "right"
        ? { top: 0, right: 0, bottom: 0, width: size }
        : { top: 0, left: 0, bottom: 0, width: size };

  const drag = React.useRef<{ start: number; size: number } | null>(null);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      const delta =
        dock === "bottom"
          ? drag.current.start - e.clientY
          : dock === "right"
            ? drag.current.start - e.clientX
            : e.clientX - drag.current.start;
      onResize(clamp(drag.current.size + delta, 200, 800));
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dock, onResize]);

  return (
    <div
      style={style}
      className={cn(
        "devtools:fixed devtools:z-[2147483647] devtools:flex devtools:flex-col devtools:bg-background devtools:text-foreground devtools:shadow-2xl",
        dock === "bottom" && "devtools:border-t devtools:border-border",
        dock === "right" && "devtools:border-l devtools:border-border",
        dock === "left" && "devtools:border-r devtools:border-border",
      )}
    >
      {children}
      <div
        role="separator"
        aria-orientation={dock === "bottom" ? "horizontal" : "vertical"}
        tabIndex={0}
        onMouseDown={(e) => {
          drag.current = {
            start: dock === "bottom" ? e.clientY : e.clientX,
            size,
          };
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            onResize(clamp(size - 20, 200, 800));
          } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            onResize(clamp(size + 20, 200, 800));
          }
        }}
        className={cn(
          "devtools:absolute devtools:bg-transparent",
          dock === "bottom" &&
            "devtools:top-0 devtools:right-0 devtools:left-0 devtools:h-1.5 devtools:cursor-ns-resize",
          dock === "right" &&
            "devtools:top-0 devtools:bottom-0 devtools:left-0 devtools:w-1.5 devtools:cursor-ew-resize",
          dock === "left" &&
            "devtools:top-0 devtools:right-0 devtools:bottom-0 devtools:w-1.5 devtools:cursor-ew-resize",
        )}
      />
    </div>
  );
}

/* ----------------------------------------------------------- PanelView */

function PanelView({
  registry,
  panel,
}: {
  registry: PluginRegistry;
  panel: PanelDescriptor;
}) {
  const [Comp, setComp] = React.useState<React.ComponentType<{
    registry: PluginRegistry;
  }> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setComp(null);
    setError(null);
    Promise.resolve(panel.load())
      .then((mod: unknown) => {
        if (cancelled) return;
        const m = mod as {
          default?: React.ComponentType<{ registry: PluginRegistry }>;
        };
        setComp(
          () =>
            m?.default ??
            (mod as React.ComponentType<{ registry: PluginRegistry }>),
        );
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
  }, [panel]);

  if (error) {
    return (
      <ErrorState
        title={`Failed to load ${panel.title}`}
        message={error.message}
      />
    );
  }
  if (!Comp) {
    return (
      <div className="devtools:p-4 devtools:text-xs devtools:text-muted-foreground">
        Loading {panel.title}…
      </div>
    );
  }
  return <Comp registry={registry} />;
}

/* -------------------------------------------------------- SettingsView */

function SettingsView({
  prefs,
  panels,
  plugins,
  onThemeChange,
  onDockChange,
  onTogglePanel,
  onActivatePlugin,
}: {
  prefs: ShellPrefs;
  panels: PanelDescriptor[];
  plugins: ReturnType<PluginRegistry["list"]>;
  onThemeChange: (theme: ThemePref) => void;
  onDockChange: (dock: DockPosition) => void;
  onTogglePanel: (id: string) => void;
  onActivatePlugin: (id: string) => void | Promise<void>;
}) {
  const onDemandPlugins = plugins.filter(
    ({ plugin }) => plugin.manifest.activation === "on-demand",
  );
  return (
    <div className="devtools:p-3">
      <PanelHeader
        title="Settings"
        description="Appearance and panel visibility"
        className="devtools:-mx-3 devtools:-mt-3 devtools:mb-2"
      />
      <div className="devtools:space-y-1">
        <SettingsRow
          label="Theme"
          description="Light, dark, or follow the system"
        >
          <Select
            value={prefs.theme}
            onChange={(v) => onThemeChange(v as ThemePref)}
            options={THEME_OPTIONS}
            label="Theme"
            className="devtools:w-28"
          />
        </SettingsRow>
        <SettingsRow label="Dock position" description="Where the panel docks">
          <Select
            value={prefs.dock}
            onChange={(v) => onDockChange(v as DockPosition)}
            options={DOCK_OPTIONS}
            label="Dock position"
            className="devtools:w-28"
          />
        </SettingsRow>
        <div className="devtools:pt-2 devtools:pb-1 devtools:text-xs devtools:font-medium devtools:text-muted-foreground">
          Panels
        </div>
        {panels.map((p) => {
          const Icon = resolveIcon(p.icon);
          return (
            <div
              key={p.id}
              className="devtools:flex devtools:items-center devtools:justify-between devtools:gap-3 devtools:py-1.5"
            >
              <span className="devtools:flex devtools:items-center devtools:gap-2 devtools:text-sm devtools:text-foreground">
                <Icon
                  className="devtools:size-4 devtools:text-muted-foreground"
                  aria-hidden
                />
                {p.title}
              </span>
              <Switch
                checked={!prefs.hiddenPanels.includes(p.id)}
                onCheckedChange={() => onTogglePanel(p.id)}
                label={`Show ${p.title}`}
              />
            </div>
          );
        })}
        {onDemandPlugins.length > 0 && (
          <>
            <div className="devtools:pt-3 devtools:pb-1 devtools:text-xs devtools:font-medium devtools:text-muted-foreground">
              Optional plugins
            </div>
            {onDemandPlugins.map(({ plugin, status, error }) => (
              <SettingsRow
                key={plugin.manifest.id}
                label={plugin.manifest.displayName}
                description={
                  status === "error"
                    ? (error?.message ?? "Activation failed")
                    : "Activate only when needed"
                }
              >
                <button
                  type="button"
                  onClick={() => void onActivatePlugin(plugin.manifest.id)}
                  disabled={status === "active"}
                  className="devtools:rounded-md devtools:border devtools:border-border devtools:px-2 devtools:py-1 devtools:text-xs devtools:text-foreground devtools:hover:bg-accent disabled:devtools:cursor-not-allowed disabled:devtools:opacity-60"
                >
                  {status === "active"
                    ? "Active"
                    : status === "error"
                      ? "Retry"
                      : "Activate"}
                </button>
              </SettingsRow>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ CommandPalette */

function CommandPalette({
  panels,
  commands,
  runtimeEntries,
  onSelectPanel,
  onClose,
}: {
  panels: PanelDescriptor[];
  commands: CommandDescriptor[];
  runtimeEntries: UniversalSearchEntry[];
  onSelectPanel: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const entries = React.useMemo<PaletteEntry[]>(() => {
    const panelEntries = fuzzyFilter(query, panels, (p) => p.title).map(
      (s) => ({ kind: "panel" as const, id: s.item.id, title: s.item.title }),
    );
    const commandEntries = fuzzyFilter(query, commands, (c) => c.title).map(
      (s) => ({ kind: "command" as const, id: s.item.id, title: s.item.title }),
    );
    const runtimeResultEntries = fuzzyFilter(
      query,
      runtimeEntries,
      (entry) => `${entry.title} ${entry.subtitle ?? ""}`,
    ).map((s) => ({ ...s.item, kind: "runtime" as const }));
    return [...panelEntries, ...commandEntries, ...runtimeResultEntries];
  }, [query, panels, commands, runtimeEntries]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const run = (entry: PaletteEntry) => {
    if (entry.kind === "runtime") {
      onSelectPanel(entry.panelId);
      return;
    }
    if (entry.kind === "panel") {
      onSelectPanel(entry.id);
      return;
    }
    const cmd = commands.find((c) => c.id === entry.id);
    if (cmd) {
      void cmd.run();
      onClose();
    }
  };

  return (
    <div
      className="devtools:fixed devtools:inset-0 devtools:z-[2147483648] devtools:flex devtools:items-start devtools:justify-center devtools:bg-black/40 devtools:pt-24"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="devtools:w-[480px] devtools:max-w-[calc(100vw-2rem)] devtools:overflow-hidden devtools:rounded-lg devtools:border devtools:border-border devtools:bg-background devtools:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search panels and commands…"
          className="devtools:w-full devtools:border-b devtools:border-border devtools:bg-transparent devtools:px-3 devtools:py-2.5 devtools:text-sm devtools:text-foreground devtools:outline-none devtools:placeholder:text-muted-foreground"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, entries.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const entry = entries[activeIndex];
              if (entry) run(entry);
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
        />
        <div className="devtools:max-h-72 devtools:overflow-y-auto devtools:p-1">
          {entries.length === 0 ? (
            <div className="devtools:px-3 devtools:py-6 devtools:text-center devtools:text-xs devtools:text-muted-foreground">
              No results.
            </div>
          ) : (
            entries.map((entry, i) => (
              <button
                key={`${entry.kind}:${entry.id}`}
                type="button"
                onClick={() => run(entry)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "devtools:flex devtools:w-full devtools:items-center devtools:gap-2 devtools:rounded-md devtools:px-2.5 devtools:py-1.5 devtools:text-left devtools:text-sm",
                  i === activeIndex
                    ? "devtools:bg-accent devtools:text-accent-foreground"
                    : "devtools:text-foreground",
                )}
              >
                <span className="devtools:text-[10px] devtools:uppercase devtools:text-muted-foreground">
                  {entry.kind}
                </span>
                <span className="devtools:min-w-0 devtools:truncate">
                  {entry.title}
                </span>
                {entry.subtitle ? (
                  <span className="devtools:ml-auto devtools:max-w-40 devtools:truncate devtools:text-xs devtools:text-muted-foreground">
                    {entry.subtitle}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
