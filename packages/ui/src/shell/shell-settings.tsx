"use client";

import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import { resolveIcon } from "../components/panel-icon";
import { PanelHeader, SettingsRow, Switch } from "../components/primitives";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import type { DockPosition, ShellPrefs, ThemePref } from "../helpers/prefs";

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

export function SettingsView({
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
  const [activationError, setActivationError] = React.useState<string | null>(
    null,
  );
  const [activating, setActivating] = React.useState<string | null>(null);
  return (
    <div className="devtools-panel devtools:max-w-3xl">
      <PanelHeader
        title="Settings"
        description="Appearance and panel visibility"
        className="devtools:mb-3"
      />
      {activationError && (
        <p
          role="alert"
          className="devtools:py-2 devtools:text-sm devtools:text-destructive"
        >
          {activationError}
        </p>
      )}
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
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={async () => {
                    setActivationError(null);
                    setActivating(plugin.manifest.id);
                    try {
                      await onActivatePlugin(plugin.manifest.id);
                    } catch (cause) {
                      setActivationError(
                        cause instanceof Error
                          ? cause.message
                          : "Could not activate plugin. Try again.",
                      );
                    } finally {
                      setActivating(null);
                    }
                  }}
                  disabled={status === "active" || activating !== null}
                  className="devtools:rounded-md devtools:border devtools:border-border devtools:px-2 devtools:py-1 devtools:text-xs devtools:text-foreground devtools:hover:bg-accent disabled:devtools:cursor-not-allowed disabled:devtools:opacity-60"
                >
                  {activating === plugin.manifest.id
                    ? "Activating…"
                    : status === "active"
                      ? "Active"
                      : status === "error"
                        ? "Retry"
                        : "Activate"}
                </Button>
              </SettingsRow>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
