"use client";

import * as React from "react";
import type { DevtoolsPlugin } from "@next-devtools/plugin-sdk";

export interface NextDevtoolsProps {
  children?: React.ReactNode;
  plugins?: DevtoolsPlugin[];
  enabled?: boolean;
  /** Opt into React Profiler timing for this component's child tree. */
  enableProfiler?: boolean;
}

export function NextDevtools({
  children,
  plugins = [],
  enabled,
  enableProfiler = false,
}: NextDevtoolsProps) {
  const [Shell, setShell] = React.useState<React.ComponentType<{
    children: React.ReactNode;
  }> | null>(null);
  const pluginsRef = React.useRef(plugins);
  pluginsRef.current = plugins;
  const stablePlugins = React.useMemo(
    () => plugins,
    [plugins.length, plugins.map((p) => p.manifest.id).join()],
  );

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (enabled === false) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ DevtoolsProvider }, { loadBuiltInPlugins }] =
          await Promise.all([
            import("@next-devtools/ui"),
            import("./loader.js"),
          ]);
        const builtins = await loadBuiltInPlugins();
        if (cancelled) return;
        const all = [...builtins, ...stablePlugins];
        const Provider = (props: { children: React.ReactNode }) => (
          <DevtoolsProvider
            plugins={all}
            enabled
            enableProfiler={enableProfiler}
          >
            {props.children}
          </DevtoolsProvider>
        );
        setShell(() => Provider);
      } catch (e) {
        console.error("NEXT_DEVTOOLS_LOAD_ERROR", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stablePlugins, enabled, enableProfiler]);

  if (!Shell) return <>{children}</>;
  return <Shell>{children}</Shell>;
}

export const DevtoolsProvider = NextDevtools;
export const NextDevtoolsProvider = NextDevtools;
export const NextDevtoolsShell = NextDevtools;

export function registerPlugin(plugin: DevtoolsPlugin): DevtoolsPlugin {
  return plugin;
}

export function registerPlugins(plugins: DevtoolsPlugin[]): DevtoolsPlugin[] {
  return plugins;
}
