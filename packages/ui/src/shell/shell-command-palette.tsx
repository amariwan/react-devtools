"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import type {
  CommandDescriptor,
  PanelDescriptor,
} from "@next-devtools/plugin-sdk";
import { cn } from "../lib/utils";
import { fuzzyFilter } from "../helpers/fuzzy";
import { useDevtoolsPortalContainer } from "../components/portal-container";
import type { UniversalSearchEntry } from "../helpers/universal-search";

type PaletteEntry =
  | { kind: "panel" | "command"; id: string; title: string; subtitle?: string }
  | (Omit<UniversalSearchEntry, "kind"> & { kind: "runtime" });

export function CommandPalette({
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
  const [error, setError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const container = useDevtoolsPortalContainer();
  const entries = React.useMemo<PaletteEntry[]>(
    () => [
      ...fuzzyFilter(query, panels, (panel) => panel.title).map(({ item }) => ({
        kind: "panel" as const,
        id: item.id,
        title: item.title,
      })),
      ...fuzzyFilter(query, commands, (command) => command.title).map(
        ({ item }) => ({
          kind: "command" as const,
          id: item.id,
          title: item.title,
        }),
      ),
      ...fuzzyFilter(
        query,
        runtimeEntries,
        (entry) => `${entry.title} ${entry.subtitle ?? ""}`,
      )
        .slice(0, 100)
        .map(({ item }) => ({ ...item, kind: "runtime" as const })),
    ],
    [query, panels, commands, runtimeEntries],
  );
  const selected = Math.min(activeIndex, Math.max(0, entries.length - 1));
  React.useEffect(() => {
    listRef.current?.children[selected]?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const run = async (entry: PaletteEntry) => {
    if (running) return;
    setError(null);
    if (entry.kind === "runtime" || entry.kind === "panel") {
      onSelectPanel(entry.kind === "runtime" ? entry.panelId : entry.id);
      return;
    }
    const command = commands.find((command) => command.id === entry.id);
    if (!command) return;
    setRunning(true);
    try {
      await command.run();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Command failed. Try again.",
      );
    } finally {
      setRunning(false);
    }
  };
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal container={container}>
        <Dialog.Backdrop className="devtools:fixed devtools:inset-0 devtools:z-[2147483647] devtools:bg-black/40" />
        <Dialog.Popup
          initialFocus={inputRef}
          aria-label="Command palette"
          className="devtools:fixed devtools:top-[12dvh] devtools:left-1/2 devtools:z-[2147483647] devtools:w-[560px] devtools:max-w-[calc(100vw-2rem)] devtools:-translate-x-1/2 devtools:overflow-hidden devtools:rounded-lg devtools:border devtools:border-border devtools:bg-popover devtools:text-popover-foreground devtools:shadow-xl"
        >
          <Dialog.Title className="devtools:sr-only">
            Search DevTools
          </Dialog.Title>
          <div className="devtools:flex devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-3">
            <Search
              aria-hidden
              className="devtools:size-4 devtools:text-muted-foreground"
            />
            <input
              ref={inputRef}
              role="combobox"
              aria-label="Search panels and commands"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={`${id}-list`}
              aria-activedescendant={
                entries.length ? `${id}-${selected}` : undefined
              }
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search panels, commands, and runtime data…"
              className="devtools:h-12 devtools:min-w-0 devtools:flex-1 devtools:bg-transparent devtools:text-sm devtools:outline-none devtools:placeholder:text-muted-foreground"
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((index) =>
                    Math.max(
                      0,
                      Math.min(
                        entries.length - 1,
                        index + (event.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  const entry = entries[selected];
                  if (entry) void run(entry);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  onClose();
                }
              }}
            />
            <Dialog.Close
              aria-label="Close search"
              className="devtools:rounded devtools:border devtools:border-border devtools:px-1.5 devtools:py-1 devtools:text-xs devtools:text-muted-foreground"
            >
              Esc
            </Dialog.Close>
          </div>
          <div
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label="Search results"
            aria-busy={running}
            className="devtools:max-h-[50dvh] devtools:overflow-y-auto devtools:p-1"
          >
            {entries.map((entry, index) => (
              <div
                key={`${entry.kind}:${entry.id}`}
                id={`${id}-${index}`}
                role="option"
                aria-selected={index === selected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void run(entry)}
                onMouseMove={() => setActiveIndex(index)}
                className={cn(
                  "devtools:flex devtools:cursor-pointer devtools:items-center devtools:gap-3 devtools:rounded-md devtools:px-3 devtools:py-2 devtools:text-sm",
                  index === selected &&
                    "devtools:bg-primary/10 devtools:text-primary",
                )}
              >
                <span className="devtools:w-16 devtools:shrink-0 devtools:text-xs devtools:text-muted-foreground">
                  {entry.kind === "runtime"
                    ? "Data"
                    : entry.kind === "panel"
                      ? "Panel"
                      : "Command"}
                </span>
                <span className="devtools:min-w-0 devtools:truncate">
                  {entry.title}
                </span>
                {entry.subtitle ? (
                  <span className="devtools:ml-auto devtools:max-w-40 devtools:truncate devtools:text-xs devtools:text-muted-foreground">
                    {entry.subtitle}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          {!entries.length && (
            <p
              role="status"
              className="devtools:px-4 devtools:py-8 devtools:text-center devtools:text-sm devtools:text-muted-foreground"
            >
              No results. Try a panel name or a shorter search.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="devtools:px-4 devtools:py-2 devtools:text-sm devtools:text-destructive"
            >
              {error}
            </p>
          )}
          <div className="devtools:flex devtools:items-center devtools:gap-2 devtools:border-t devtools:border-border devtools:px-3 devtools:py-2 devtools:text-xs devtools:text-muted-foreground">
            <ArrowUp aria-hidden className="devtools:size-3" />
            <ArrowDown aria-hidden className="devtools:size-3" /> Navigate{" "}
            <span className="devtools:ml-2">Enter to open</span>
            {running && (
              <span role="status" className="devtools:ml-auto">
                Running…
              </span>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
