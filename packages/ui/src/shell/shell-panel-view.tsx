"use client";

import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import type { PanelDescriptor } from "@next-devtools/plugin-sdk";
import { ErrorState } from "../components/primitives";

export function PanelView({
  registry,
  panel,
}: {
  registry: PluginRegistry;
  panel: PanelDescriptor;
}) {
  const [Comp, setComp] = React.useState<React.ComponentType<{
    registry: PluginRegistry;
  }> | null>(null);
  const [attempt, retry] = React.useReducer((value) => value + 1, 0);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setComp(null);
    setError(null);
    Promise.resolve()
      .then(() => panel.load())
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
  }, [panel, attempt]);

  if (error) {
    return (
      <ErrorState
        title={`Failed to load ${panel.title}`}
        message={error.message}
        onRetry={retry}
      />
    );
  }
  if (!Comp) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="devtools:space-y-3 devtools:p-4 devtools:text-xs devtools:text-muted-foreground"
      >
        <p>Loading {panel.title}…</p>
        <div
          aria-hidden
          className="devtools:h-8 devtools:rounded devtools:bg-muted"
        />
        <div
          aria-hidden
          className="devtools:h-24 devtools:rounded devtools:bg-muted"
        />
      </div>
    );
  }
  return (
    <PanelBoundary
      key={`${panel.id}:${attempt}`}
      title={panel.title}
      onRetry={retry}
    >
      <Comp registry={registry} />
    </PanelBoundary>
  );
}

class PanelBoundary extends React.Component<
  {
    title: string;
    onRetry: () => void;
    children: React.ReactNode;
  },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    return this.state.error ? (
      <ErrorState
        title={`${this.props.title} could not render`}
        message={this.state.error.message}
        onRetry={this.props.onRetry}
      />
    ) : (
      this.props.children
    );
  }
}
