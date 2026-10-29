"use client";

import * as React from "react";
import { Code2, CrosshairIcon } from "lucide-react";

export function DevtoolsLauncher({
  onOpen,
  onPick,
  expanded: forcedExpanded,
}: {
  onOpen: () => void;
  onPick: () => void;
  expanded?: boolean;
}) {
  const [hoverExpanded, setHoverExpanded] = React.useState(false);
  const expanded = forcedExpanded || hoverExpanded;

  return (
    <div
      className="devtools-launcher"
      data-expanded={expanded}
      onPointerEnter={() => setHoverExpanded(true)}
      onPointerLeave={() => setHoverExpanded(false)}
      onFocusCapture={() => setHoverExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHoverExpanded(false);
        }
      }}
    >
      <button
        type="button"
        aria-label="Open Next.js DevTools"
        onPointerDown={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className="devtools-launcher-action devtools-launcher-logo"
      >
        <Code2 aria-hidden className="devtools:size-4" />
      </button>
      <span aria-hidden="true" className="devtools-launcher-divider" />
      <button
        type="button"
        aria-label="Pick element"
        onClick={onPick}
        className="devtools-launcher-action devtools-launcher-picker"
        tabIndex={expanded ? 0 : -1}
      >
        <CrosshairIcon aria-hidden className="devtools:size-3.5" />
      </button>
    </div>
  );
}
