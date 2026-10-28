import {
  discoverAppRouterFilesSync,
  discoverAppRouterMetadataSync,
  detectAppRootSync,
} from "@next-devtools/host-next";
import { resolve } from "node:path";

export interface NextDevtoolsConfigOptions {
  /**
   * Enable dev-only features. Defaults to true outside production.
   */
  enabled?: boolean;
  /**
   * Client instrumentation module injected by Next.js (v16.3+) before
   * the application's own `instrumentation-client` file. Defaults to the
   * package's auto-mounting DevTools client module.
   */
  instrumentationClientModule?: string;
  /** Trusted server-side project root used for route discovery. */
  projectRoot?: string;
  /** Trusted route root relative to projectRoot, for monorepos/custom hosts. */
  appRoot?: string;
}

export type NextDevtoolsInjected = {
  env?: Record<string, string>;
  serverExternalPackages?: string[];
  instrumentationClientInject?: string[];
};

export function withNextDevtools<T extends object>(
  nextConfig: T = {} as T,
  options: NextDevtoolsConfigOptions = {},
): T & NextDevtoolsInjected {
  const enabled =
    process.env.NODE_ENV !== "production" && (options.enabled ?? true);
  const userConfig = (nextConfig ?? {}) as Record<string, unknown>;

  // Production builds (or explicit disable) receive the user config unchanged,
  // so DevTools code is neither configured nor injected.
  if (!enabled) {
    return { ...userConfig } as T & NextDevtoolsInjected;
  }

  const config: Record<string, unknown> = { ...userConfig };

  // Discover App Router files at config time (server/build context) so the
  // client never needs filesystem access or client-supplied roots.
  let routeFiles: string[] = [];
  let routeMetadata: Record<
    string,
    { execution: "server" | "client" | "unknown" }
  > = {};
  let appRoot = "app";
  try {
    const projectRoot = resolve(options.projectRoot ?? process.cwd());
    const detectedAppRoot = options.appRoot
      ? options.appRoot
      : detectAppRootSync(projectRoot);
    appRoot = detectedAppRoot ?? appRoot;
    if (appRoot) {
      routeFiles = discoverAppRouterFilesSync({ projectRoot, appRoot });
      routeMetadata = discoverAppRouterMetadataSync({ projectRoot, appRoot });
    }
  } catch {
    routeFiles = [];
  }

  // Preserve server-only packages used by DevTools.
  const existingExternal = Array.isArray(config.serverExternalPackages)
    ? (config.serverExternalPackages as string[])
    : [];
  const external = new Set([
    ...existingExternal,
    "@next-devtools/host-next",
    "@next-devtools/next",
  ]);
  config.serverExternalPackages = Array.from(external);

  // Merge, rather than replace, any user-provided instrumentation client
  // modules so both the user's and DevTools' hooks run.
  const existingInject = Array.isArray(config.instrumentationClientInject)
    ? (config.instrumentationClientInject as string[])
    : [];
  const injectModule =
    options.instrumentationClientModule ??
    "@next-devtools/next/instrumentation-client";
  if (!existingInject.includes(injectModule)) {
    config.instrumentationClientInject = [...existingInject, injectModule];
  }

  // Preserve and merge user-defined rewrites.
  const originalRewrites = config.rewrites;
  config.rewrites = async () => {
    let userRewrites: unknown = [];
    if (typeof originalRewrites === "function") {
      userRewrites = await (originalRewrites as () => unknown)();
    } else if (originalRewrites) {
      userRewrites = originalRewrites;
    }
    return userRewrites as never;
  };

  // Turbopack-compatible: no webpack-only hooks are added.
  // Dev-only marker for client/runtime guards.
  config.env = {
    ...((config.env as Record<string, string> | undefined) ?? {}),
    NEXT_DEVTOOLS: "1",
    NEXT_DEVTOOLS_ROUTE_FILES: JSON.stringify(routeFiles),
    NEXT_DEVTOOLS_APP_ROOT: appRoot,
    NEXT_DEVTOOLS_ROUTE_METADATA: JSON.stringify(routeMetadata),
  };

  return config as T & NextDevtoolsInjected;
}

export const withDevtools = withNextDevtools;
