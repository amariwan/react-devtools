"use client";

import * as React from "react";

// Auto-mounting DevTools client module. Injected via
// `instrumentationClientInject` by `withNextDevtools` in development only.
// This module intentionally performs no work in production.

type RootLike = {
  unmount?: () => void;
  render: (node: React.ReactElement) => void;
};

const GLOBAL_KEY = "__NEXT_DEVTOOLS_AUTO_ROOT__";

function isDev(): boolean {
  return (
    typeof process !== "undefined" && process.env?.NODE_ENV !== "production"
  );
}

async function mount(): Promise<void> {
  if (!isDev()) return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const g = window as unknown as Record<string, unknown>;
  if (g[GLOBAL_KEY]) return; // already mounted (HMR guard)

  try {
    const [{ createElement }, { createRoot }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
    ]);
    const [{ DevtoolsProvider }, { loadBuiltInPlugins }] = await Promise.all([
      import("@next-devtools/ui"),
      import("./loader.js"),
    ]);

    const plugins = await loadBuiltInPlugins();

    const host = document.createElement("next-devtools-root");
    document.body.appendChild(host);

    const root = createRoot(host) as unknown as RootLike;
    g[GLOBAL_KEY] = root;

    root.render(
      createElement(DevtoolsProvider, { plugins, enabled: true }, null),
    );

    if (
      (
        import.meta as unknown as {
          hot?: { dispose: (cb: () => void) => void };
        }
      ).hot
    ) {
      (
        import.meta as unknown as { hot: { dispose: (cb: () => void) => void } }
      ).hot.dispose(() => {
        try {
          root.unmount?.();
        } catch {
          /* ignore */
        }
        delete g[GLOBAL_KEY];
      });
    }
  } catch (error) {
    // DevTools must never break the host application.
    console.error("[next-devtools] failed to auto-mount", error);
  }
}

void mount();

export {};
