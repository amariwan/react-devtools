// Element source resolution using React Grab primitives when available,
// with fallback to fiber._debugSource and compile-attribute.

export type ElementSourceOrigin =
  "react-grab" | "fiber-definition" | "compile-attribute" | "unavailable";

export type ElementSourceRole =
  "element-usage" | "component-definition" | "unknown";

export type ResolvedElementSource = {
  origin: ElementSourceOrigin;
  role: ElementSourceRole;
  componentName: string | null;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  fiber: unknown | null;
  parentComponents: Array<{
    name: string;
    filePath: string | null;
    lineNumber: number | null;
  }>;
};

export async function resolveElementSource(
  element: Element,
): Promise<ResolvedElementSource> {
  // Try React Grab first
  try {
    const rg = await import("react-grab/primitives" as string).catch(
      () => null,
    );
    if (rg && typeof rg.getElementContext === "function") {
      const ctx = await rg.getElementContext(element);
      const parentComponents: ResolvedElementSource["parentComponents"] = [];
      if (Array.isArray(ctx.stack)) {
        for (const frame of ctx.stack) {
          parentComponents.push({
            name:
              (frame as { componentName?: string })?.componentName ??
              (frame as { name?: string })?.name ??
              "Unknown",
            filePath:
              (frame as { fileName?: string })?.fileName ??
              (frame as { filePath?: string })?.filePath ??
              null,
            lineNumber: (frame as { lineNumber?: number })?.lineNumber ?? null,
          });
        }
      }
      return {
        origin: "react-grab",
        role: "element-usage",
        componentName: ctx.componentName ?? null,
        filePath: ctx.filePath ?? null,
        lineNumber: ctx.lineNumber ?? null,
        columnNumber: ctx.columnNumber ?? null,
        fiber: ctx.fiber ?? null,
        parentComponents,
      };
    }
  } catch {
    // fall through
  }

  // Fallback: fiber._debugSource
  try {
    const fiberKey = Object.keys(element).find(
      (k) =>
        k.startsWith("__reactFiber$") ||
        k.startsWith("__reactInternalInstance$"),
    );
    if (fiberKey) {
      const fiber = (element as unknown as Record<string, unknown>)[
        fiberKey
      ] as
        | {
            _debugSource?: {
              fileName: string;
              lineNumber: number;
              columnNumber: number;
            };
            type?: { displayName?: string; name?: string };
          }
        | undefined;
      if (fiber?._debugSource) {
        return {
          origin: "fiber-definition",
          role: "component-definition",
          componentName: fiber.type?.displayName ?? fiber.type?.name ?? null,
          filePath: fiber._debugSource.fileName,
          lineNumber: fiber._debugSource.lineNumber,
          columnNumber: fiber._debugSource.columnNumber,
          fiber,
          parentComponents: [],
        };
      }
      // walk up fiber to find source
      type FiberLike = {
        _debugSource?: {
          fileName: string;
          lineNumber: number;
          columnNumber: number;
        };
        type?: { displayName?: string; name?: string };
        return?: FiberLike;
      };
      let cur: FiberLike | undefined = fiber as FiberLike | undefined;
      while (cur) {
        if (cur._debugSource) {
          return {
            origin: "fiber-definition",
            role: "component-definition",
            componentName: cur.type?.displayName ?? cur.type?.name ?? null,
            filePath: cur._debugSource.fileName,
            lineNumber: cur._debugSource.lineNumber,
            columnNumber: cur._debugSource.columnNumber,
            fiber: cur,
            parentComponents: [],
          };
        }
        cur = cur.return;
      }
    }
  } catch {
    // fall through
  }

  // Fallback: data-ndt-source attribute
  const el = element as HTMLElement;
  const attr = el.getAttribute?.("data-ndt-source");
  if (attr) {
    const m = attr.match(/^(.+):(\d+):(\d+)$/);
    if (m) {
      return {
        origin: "compile-attribute",
        role: "element-usage",
        componentName: el.getAttribute("data-ndt-component") ?? null,
        filePath: m[1]!,
        lineNumber: Number(m[2]),
        columnNumber: Number(m[3]),
        fiber: null,
        parentComponents: [],
      };
    }
  }

  return {
    origin: "unavailable",
    role: "unknown",
    componentName: null,
    filePath: null,
    lineNumber: null,
    columnNumber: null,
    fiber: null,
    parentComponents: [],
  };
}
