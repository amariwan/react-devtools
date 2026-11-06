"use client";

import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import {
	RUNTIME_SERVICE_IDS,
	type RuntimeServiceStatus,
} from "@next-devtools/contracts";
import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import { EmptyState } from "../components/primitives";
import {
  defaultPrefs,
  loadPrefs,
  resolveEffectiveTheme,
  savePrefs,
  type ShellPrefs,
  type ThemePref,
} from "../helpers/prefs";
import {
	createPanelGroups,
	flattenVisiblePanelGroups,
} from "../helpers/panel-catalog";
import {
  pickActivePanelId,
  resolveShellShortcut,
} from "../helpers/shell-affordances";
import {
  buildUniversalSearchEntries,
  type UniversalSearchSnapshots,
} from "../helpers/universal-search";
import { DevtoolsPortalContext } from "../components/portal-container";
import { CommandPalette } from "./shell-command-palette";
import { DevtoolsLauncher } from "./shell-launcher";
import { Dock } from "./shell-dock";
import { PanelRail } from "./shell-panel-rail";
import { Sidebar, SidebarProvider } from "../components/ui/sidebar";
import { PanelView } from "./shell-panel-view";
import { SettingsView } from "./shell-settings";
import { ShellMobileNavigation } from "./shell-mobile-navigation";

export interface DevtoolsShellProps {
  registry: PluginRegistry;
  enabled?: boolean;
}

export function DevtoolsShell({
  registry,
  enabled = true,
}: DevtoolsShellProps) {
  const [portalContainer, setPortalContainer] =
    React.useState<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [activePanelId, setActivePanelId] = React.useState<string | null>(null);
  const [panels, setPanels] = React.useState<PanelDescriptor[]>([]);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [pluginRevision, setPluginRevision] = React.useState(0);
  const [, setRuntimeRevision] = React.useState(0);
  const [systemDark, setSystemDark] = React.useState(false);
  const [prefs, setPrefs] = React.useState<ShellPrefs>(() =>
    typeof window === "undefined"
      ? defaultPrefs()
      : loadPrefs(window.localStorage),
  );

  React.useEffect(() => {
    if (!enabled) return;
    const unsubscribe = registry.panels.onChange((nextPanels) =>
      setPanels([...nextPanels]),
    );
    setPanels([...registry.panels.list()]);
    return unsubscribe;
  }, [registry, enabled]);

  React.useEffect(() => {
    if (!enabled || !cmdOpen) return;
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
  }, [registry, enabled, cmdOpen]);

  React.useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const previousFocus = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!open || !portalContainer) return;
    const root = portalContainer.getRootNode();
    previousFocus.current = (
      root instanceof ShadowRoot ? root.activeElement : document.activeElement
    ) as HTMLElement | null;
    const frame = requestAnimationFrame(() =>
      portalContainer
        .querySelector<HTMLElement>(
          '[role="tab"][tabindex="0"], [aria-label="Settings"]',
        )
        ?.focus(),
    );
    return () => {
      cancelAnimationFrame(frame);
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, [open, portalContainer]);

  const effectiveTheme = resolveEffectiveTheme(prefs.theme, systemDark);

  React.useEffect(() => {
    if (typeof window !== "undefined") savePrefs(window.localStorage, prefs);
  }, [prefs]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const path = event.composedPath();
      const inDevtools = path.some(
        (node) =>
          node instanceof HTMLElement && node.hasAttribute("data-devtools-ui"),
      );
      if (event.key === "Escape" && !inDevtools) return;
      const action = resolveShellShortcut({
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        open,
        overlayOpen: cmdOpen || settingsOpen,
      });
      if (action === null) return;
      if (action !== "close-overlays" && action !== "close-devtools") {
        event.preventDefault();
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

  const panelGroups = React.useMemo(
		() => createPanelGroups(panels, prefs),
		[prefs, panels],
	);
  const visiblePanels = React.useMemo(
		() => flattenVisiblePanelGroups(panelGroups, prefs.hiddenPanels),
		[panelGroups, prefs.hiddenPanels],
	);

  React.useEffect(() => {
    if (!open) return;
    setActivePanelId((current) => {
      if (current && visiblePanels.some((panel) => panel.id === current)) {
        return current;
      }
      return (
        visiblePanels.find((panel) => panel.id === "overview")?.id ??
        pickActivePanelId(visiblePanels, current)
      );
    });
  }, [open, visiblePanels]);

  const activePanel = visiblePanels.find((p) => p.id === activePanelId) ?? null;
  const commands = registry.commands.list();
	const snapshotFor = (id: string): unknown =>
    registry.services
      .get<{ getSnapshot(): { data: unknown } }>(id)
      ?.getSnapshot().data;
	const reactServiceSnapshot = registry.services
		.get<{
			getSnapshot(): { data: unknown; status: RuntimeServiceStatus };
		}>(RUNTIME_SERVICE_IDS.react)
		?.getSnapshot();
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
  const runtimeSearchEntries = cmdOpen
    ? buildUniversalSearchEntries(runtimeSnapshots)
    : [];
  const registeredPlugins = React.useMemo(
    () => registry.list(),
    [registry, pluginRevision],
  );
  React.useEffect(
    () => registry.onChange(() => setPluginRevision((value) => value + 1)),
    [registry],
  );

  const setTheme = (theme: ThemePref) =>
    setPrefs((prefs) => ({ ...prefs, theme }));
  const togglePanel = (id: string) =>
    setPrefs((prefs) => ({
      ...prefs,
      hiddenPanels: prefs.hiddenPanels.includes(id)
        ? prefs.hiddenPanels.filter((panelId) => panelId !== id)
        : [...prefs.hiddenPanels, id],
    }));
  const selectPanel = (id: string) => {
    setActivePanelId(id);
    setSettingsOpen(false);
    setCmdOpen(false);
  };
  React.useEffect(() => {
    const navigate = (event: Event) => {
      const id: unknown = (event as CustomEvent).detail;
      if (id === "settings") {
        setSettingsOpen(true);
        setOpen(true);
        return;
      }
      if (typeof id !== "string" || !panels.some((panel) => panel.id === id))
        return;
      setPrefs((value) => ({
        ...value,
        hiddenPanels: value.hiddenPanels.filter((panelId) => panelId !== id),
      }));
      setActivePanelId(id);
      setSettingsOpen(false);
      setOpen(true);
    };
    window.addEventListener("next-devtools:navigate", navigate);
    return () => window.removeEventListener("next-devtools:navigate", navigate);
  }, [panels]);
  const activatePlugin = async (id: string) => {
    await registry.activate(id);
    setPluginRevision((revision) => revision + 1);
  };
  const startElementPicker = () => {
    selectPanel("components");
    window.dispatchEvent(new CustomEvent("next-devtools:pick-element"));
  };

  if (!enabled) return null;

  return (
    <DevtoolsPortalContext.Provider value={portalContainer}>
      <div
        ref={setPortalContainer}
        data-devtools-ui=""
        data-theme={effectiveTheme}
                style={{ zoom: prefs.uiScale }}
        className="devtools:font-sans devtools:text-sm devtools:text-foreground"
      >
		{open ? (
						<Dock position={prefs.dock} size={prefs.dockSize}>
							<ShellMobileNavigation
								panels={visiblePanels}
								activePanelId={activePanelId}
								settingsOpen={settingsOpen}
								onSelect={selectPanel}
								onSettings={() => setSettingsOpen((value) => !value)}
								onSearch={() => setCmdOpen(true)}
								theme={effectiveTheme}
								onThemeToggle={() =>
									setTheme(effectiveTheme === "dark" ? "light" : "dark")
								}
							/>
            <SidebarProvider
              contained
              open={prefs.expandSidebar}
              onOpenChange={(next) =>
                setPrefs((value) => ({ ...value, expandSidebar: next }))
              }
              className="devtools:min-h-0 devtools:flex-1"
            >
              <Sidebar
                contained
                collapsible="icon"
                className="devtools:@max-[520px]/devtools:hidden"
              >
                <PanelRail
                  panels={visiblePanels}
                  activePanelId={activePanelId}
                  settingsOpen={settingsOpen}
                  scrollable={prefs.scrollableSidebar}
                  connected={
                    reactServiceSnapshot?.status === "available" ||
                    reactServiceSnapshot?.status === "partial"
                  }
                  theme={effectiveTheme}
                  onSelect={selectPanel}
                  onSettings={() => setSettingsOpen((value) => !value)}
                  onSearch={() => setCmdOpen(true)}
                  onThemeToggle={() =>
                    setTheme(effectiveTheme === "dark" ? "light" : "dark")
                  }
                  onRefresh={() => window.location.reload()}
                  onClose={() => setOpen(false)}
                />
              </Sidebar>
              <main
                id="devtools-panel-view"
                role={settingsOpen ? "region" : "tabpanel"}
                aria-label={settingsOpen ? "Settings" : undefined}
                aria-labelledby={
                  !settingsOpen && activePanel
                    ? `devtools-tab-${activePanel.id}`
                    : undefined
                }
                tabIndex={0}
                className="devtools:min-w-0 devtools:flex-1 devtools:overflow-hidden"
              >
                <div
                  data-slot="panel-content"
                  className="devtools:h-full devtools:min-w-0 devtools:overflow-auto"
                >
                  {settingsOpen ? (
                    <SettingsView
                      prefs={prefs}
                      panels={panels}
                      plugins={registeredPlugins}
                      onThemeChange={setTheme}
                      onDockChange={(dock) =>
                        setPrefs((value) => ({ ...value, dock }))
                      }
                      onDockSizeChange={(dockSize) =>
                        setPrefs((value) => ({ ...value, dockSize }))
                      }
                      onScaleChange={(uiScale) =>
                        setPrefs((value) => ({ ...value, uiScale }))
                      }
						onToggleHighlightUpdates={() =>
							setPrefs((value) => ({
								...value,
								highlightUpdates: !value.highlightUpdates,
							}))
						}
                      onToggleSidebar={() =>
                        setPrefs((value) => ({
                          ...value,
                          expandSidebar: !value.expandSidebar,
                        }))
                      }
									onToggleScrollableSidebar={() =>
										setPrefs((value) => ({
											...value,
											scrollableSidebar: !value.scrollableSidebar,
										}))
									}
						onTogglePanelCategory={(category) =>
							setPrefs((value) => ({
								...value,
								hiddenPanelCategories: value.hiddenPanelCategories.includes(category)
									? value.hiddenPanelCategories.filter((item) => item !== category)
									: [...value.hiddenPanelCategories, category],
							}))
						}
						onTogglePinPanel={(id) =>
							setPrefs((value) => ({
								...value,
								pinnedPanels: value.pinnedPanels.includes(id)
									? value.pinnedPanels.filter((panelId) => panelId !== id)
									: [...value.pinnedPanels, id],
							}))
						}
						onMovePinnedPanel={(id, delta) =>
							setPrefs((value) => {
								const index = value.pinnedPanels.indexOf(id);
								const nextIndex = index + delta;
								if (
									index < 0 ||
									nextIndex < 0 ||
									nextIndex >= value.pinnedPanels.length
								)
									return value;
								const next = [...value.pinnedPanels];
								next.splice(index, 1);
								next.splice(nextIndex, 0, id);
								return { ...value, pinnedPanels: next };
							})
						}
									onResetSettings={() => setPrefs(defaultPrefs())}
                      onTogglePanel={togglePanel}
                      onActivatePlugin={activatePlugin}
                    />
                  ) : activePanel ? (
						<PanelView
							registry={registry}
							panel={activePanel}
							highlightUpdates={prefs.highlightUpdates}
						/>
                  ) : (
                    <EmptyState
                      title="No panel selected"
                      description="Choose a panel from the sidebar."
                    />
                  )}
                </div>
              </main>
            </SidebarProvider>
          </Dock>
        ) : null}
        <DevtoolsLauncher
          onOpen={() => setOpen((value) => !value)}
          onPick={startElementPicker}
          expanded={open}
        />
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
    </DevtoolsPortalContext.Provider>
  );
}
