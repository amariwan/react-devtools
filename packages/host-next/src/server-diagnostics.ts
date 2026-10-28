// Server-side diagnostic helpers wrapping Next instrumentation.

export type ServerDiagnostic = {
  kind: "render" | "route" | "action" | "proxy" | "unknown";
  message: string;
  digest?: string;
  route?: string;
  timestampUnixMs: number;
};

export type ServerDiagnosticContext = {
  kind?: ServerDiagnostic["kind"];
  route?: string;
  path?: string;
};

export type NextRequestErrorContext = {
  routerKind: "Pages Router" | "App Router";
  routePath: string;
  routeType: "render" | "route" | "action" | "proxy";
  renderSource?:
    | "react-server-components"
    | "react-server-components-payload"
    | "server-rendering";
  revalidateReason?: "on-demand" | "stale";
};

export type NextRequestError = {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
};

export type NextRequestErrorHandler = (
  error: unknown,
  request: Readonly<NextRequestError>,
  context: Readonly<NextRequestErrorContext>,
) => void | Promise<void>;

function boundedPath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? path;
  return withoutQuery.length <= 2048
    ? withoutQuery
    : `${withoutQuery.slice(0, 2048)}…`;
}

export function normalizeRequestError(
  error: unknown,
  context: ServerDiagnosticContext,
): ServerDiagnostic {
  const err = error instanceof Error ? error : new Error(String(error));
  const kind = context.kind ?? "unknown";
  const digest = (err as { digest?: string }).digest;
  const route = context.route ?? context.path;
  const out: ServerDiagnostic = {
    kind,
    message: err.message,
    timestampUnixMs: Date.now(),
  };
  if (digest !== undefined) out.digest = digest;
  if (route !== undefined) out.route = route;
  return out;
}

/**
 * Adapt Next.js' supported `instrumentation` onRequestError hook to the
 * payload-free diagnostic contract. Request headers and method are ignored by
 * design so credentials and request bodies never enter the diagnostic event.
 */
export function createNextRequestErrorHandler(
  onDiagnostic: (diagnostic: ServerDiagnostic) => void | Promise<void>,
): NextRequestErrorHandler {
  return async (_error, request, context) => {
    await onDiagnostic(
      normalizeRequestError(_error, {
        kind: context.routeType,
        path: boundedPath(request.path || context.routePath),
      }),
    );
  };
}

/**
 * Opt-in server boundary for applications that want normalized error events.
 * It deliberately reports metadata only and rethrows the original exception.
 */
export function wrapServerRequest<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => TResult | Promise<TResult>,
  context: ServerDiagnosticContext,
  onDiagnostic: (diagnostic: ServerDiagnostic) => void,
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      onDiagnostic(normalizeRequestError(error, context));
      throw error;
    }
  };
}

// Wrap an existing register export without overwriting it.
export function composeRegister(
  existing: (() => void | Promise<void>) | undefined,
  addon: () => void | Promise<void>,
) {
  return async () => {
    if (existing) await existing();
    await addon();
  };
}
