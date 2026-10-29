"use client";

import * as React from "react";
import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import { Settings2 } from "lucide-react";
import { cn } from "../lib/utils";
import { resolveIcon } from "../components/panel-icon";

export function PanelRail({
  panels,
  activePanelId,
  settingsOpen,
  onSelect,
  onSettings,
}: {
  panels: PanelDescriptor[];
  activePanelId: string | null;
  settingsOpen: boolean;
  onSelect: (id: string) => void;
  onSettings: () => void;
}) {
  const refs = React.useRef(new Map<string, HTMLButtonElement>());
  return (
    <nav
      aria-label="DevTools navigation"
      className="devtools-rail devtools:flex devtools:shrink-0 devtools:flex-col devtools:border-r devtools:border-border devtools:bg-muted/40"
    >
      <div
        role="tablist"
        aria-label="Panels"
        aria-orientation="vertical"
        className="devtools:flex devtools:min-h-0 devtools:flex-1 devtools:flex-col devtools:gap-1 devtools:overflow-y-auto devtools:p-1.5"
      >
        {panels.map((panel, index) => {
          const Icon = resolveIcon(panel.icon);
          const active = !settingsOpen && panel.id === activePanelId;
          return (
            <button
              key={panel.id}
              ref={(element) => {
                if (element) refs.current.set(panel.id, element);
                else refs.current.delete(panel.id);
              }}
              id={`devtools-tab-${panel.id}`}
              type="button"
              role="tab"
              title={panel.title}
              aria-label={panel.title}
              aria-selected={active}
              aria-controls="devtools-panel-view"
              tabIndex={
                panel.id === activePanelId || (!activePanelId && index === 0)
                  ? 0
                  : -1
              }
              onClick={() => onSelect(panel.id)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowDown"
                    ? (index + 1) % panels.length
                    : event.key === "ArrowUp"
                      ? (index - 1 + panels.length) % panels.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? panels.length - 1
                          : null;
                if (next === null) return;
                event.preventDefault();
                const target = panels[next];
                if (target) {
                  onSelect(target.id);
                  refs.current.get(target.id)?.focus();
                }
              }}
              className={cn(
                "devtools-rail-item devtools:flex devtools:h-9 devtools:shrink-0 devtools:items-center devtools:gap-2.5 devtools:rounded-md devtools:px-2.5 devtools:text-left devtools:text-xs devtools:font-medium devtools:text-muted-foreground devtools:transition-colors devtools:hover:bg-accent devtools:hover:text-foreground",
                active && "devtools:bg-primary/10 devtools:text-primary",
              )}
            >
              <Icon className="devtools:size-4 devtools:shrink-0" aria-hidden />
              <span className="devtools-rail-label devtools:truncate">
                {panel.title}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        aria-pressed={settingsOpen}
        onClick={onSettings}
        className={cn(
          "devtools-rail-item devtools:flex devtools:h-11 devtools:shrink-0 devtools:items-center devtools:gap-2.5 devtools:border-t devtools:border-border devtools:px-4 devtools:text-xs devtools:text-muted-foreground devtools:hover:bg-accent",
          settingsOpen && "devtools:bg-primary/10 devtools:text-primary",
        )}
      >
        <Settings2 className="devtools:size-4" aria-hidden />
        <span className="devtools-rail-label">Settings</span>
      </button>
    </nav>
  );
}
