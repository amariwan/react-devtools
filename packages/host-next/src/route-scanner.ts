// Next.js App Router static scanner (pure, testable).
// Input: list of workspace-relative paths (relative to project root, e.g. "app/blog/[slug]/page.tsx").
// Output: flat list of route segment nodes with parent references.

export type SegmentKind =
  | "root"
  | "static"
  | "dynamic"
  | "catch-all"
  | "optional-catch-all"
  | "group"
  | "parallel-slot"
  | "intercepting";

export type FileRole =
  | "page"
  | "layout"
  | "template"
  | "loading"
  | "error"
  | "global-error"
  | "not-found"
  | "default"
  | "route"
  | "proxy";

export type RouteExecution = "server" | "client" | "unknown";

export type RouteFileMetadata = {
  execution: RouteExecution;
};

export type RouteSegment = {
  id: string;
  // path relative to app root, e.g. "blog/[slug]"
  relativePath: string;
  // directory name of this segment
  name: string;
  kind: SegmentKind;
  parentId: string | null;
  // url pattern contribution (empty for groups/parallel slots that don't affect URL)
  urlSegment: string;
  // dynamic param names
  dynamicParamNames: string[];
  isIntercepted: boolean;
  interceptPrefix?: string; // (.), (..), (...)
  parallelSlot?: string; // slot name without @
  fileRoles: FileRole[];
  execution?: RouteExecution;
  sourceLocation: { relativePath: string; line: number; column: number };
};

export type RouteTree = {
  rootId: string;
  nodes: RouteSegment[];
};

const FILE_ROLE_MAP: Record<string, FileRole> = {
  page: "page",
  layout: "layout",
  template: "template",
  loading: "loading",
  error: "error",
  "global-error": "global-error",
  "not-found": "not-found",
  default: "default",
  route: "route",
  proxy: "proxy",
  middleware: "proxy",
};

function classifyFileName(base: string): FileRole | null {
  // base like "page.tsx" or "page.mdx"
  const name = base.split(".")[0] ?? "";
  return FILE_ROLE_MAP[name] ?? null;
}

function classifyDirName(name: string): {
  kind: SegmentKind;
  urlSegment: string;
  dynamicParamNames: string[];
  isIntercepted: boolean;
  interceptPrefix?: string;
  parallelSlot?: string;
} {
  // parallel slot
  if (name.startsWith("@")) {
    return {
      kind: "parallel-slot",
      urlSegment: "",
      dynamicParamNames: [],
      isIntercepted: false,
      parallelSlot: name.slice(1),
    };
  }
  // route group
  if (
    name.startsWith("(") &&
    name.endsWith(")") &&
    !name.includes("..") &&
    !name.startsWith("(..") &&
    !name.startsWith("(...)")
  ) {
    // could be intercepting (.) (..) (...)
    if (
      name === "(.)" ||
      name === "(..)" ||
      name === "(...)" ||
      name.startsWith("(..") ||
      name.startsWith("(...)") ||
      name === "(.)"
    ) {
      // intercepting
    }
    // intercepting check
    if (/^\(\.{1,3}\)$/.test(name) || /^\(\.{1,3}\).+/.test(name)) {
      return classifyIntercept(name);
    }
    return {
      kind: "group",
      urlSegment: "",
      dynamicParamNames: [],
      isIntercepted: false,
    };
  }
  // intercepting routes: (.), (..), (...)
  if (/^\(\.{1,3}\)/.test(name)) {
    return classifyIntercept(name);
  }
  // optional catch-all [[...param]]
  const optMatch = name.match(/^\[\[\.\.\.(.+)\]\]$/);
  if (optMatch) {
    return {
      kind: "optional-catch-all",
      urlSegment: `[...${optMatch[1]}]`,
      dynamicParamNames: [optMatch[1]!],
      isIntercepted: false,
    };
  }
  // catch-all [...param]
  const catchMatch = name.match(/^\[\.\.\.(.+)\]$/);
  if (catchMatch) {
    return {
      kind: "catch-all",
      urlSegment: `[...${catchMatch[1]}]`,
      dynamicParamNames: [catchMatch[1]!],
      isIntercepted: false,
    };
  }
  // dynamic [param]
  const dynMatch = name.match(/^\[(.+)\]$/);
  if (dynMatch) {
    return {
      kind: "dynamic",
      urlSegment: `[${dynMatch[1]}]`,
      dynamicParamNames: [dynMatch[1]!],
      isIntercepted: false,
    };
  }
  return {
    kind: "static",
    urlSegment: name,
    dynamicParamNames: [],
    isIntercepted: false,
  };
}

function classifyIntercept(name: string): {
  kind: SegmentKind;
  urlSegment: string;
  dynamicParamNames: string[];
  isIntercepted: boolean;
  interceptPrefix?: string;
  parallelSlot?: string;
} {
  const m = name.match(/^\((\.{1,3})\)(.*)$/);
  const prefix = m ? m[1]! : "";
  const rest = m ? m[2]! : name;
  // the rest is the actual segment name; classify it for url
  const base = classifyDirName(rest === "" ? name : rest);
  return {
    kind: "intercepting",
    urlSegment: base.urlSegment,
    dynamicParamNames: base.dynamicParamNames,
    isIntercepted: true,
    interceptPrefix: prefix,
  };
}

export function scanAppRouter(
  filePaths: string[],
  appRoot = "app",
  fileMetadata?: Readonly<Record<string, RouteFileMetadata>>,
): RouteTree {
  // normalize: only files under appRoot
  const normalizedAppRoot = appRoot
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/$/, "");
  const appPrefix = normalizedAppRoot + "/";
  const relevant = filePaths
    .map((p) => p.replace(/\\/g, "/").replace(/^\.\//, ""))
    .filter((p) => !p.split("/").includes(".."))
    .filter((p) => p.startsWith(appPrefix));

  // collect directories and their files
  const dirFiles = new Map<string, string[]>(); // relative dir (under app) -> file basenames
  for (const p of relevant) {
    const rel = p.slice(appPrefix.length);
    const parts = rel.split("/");
    const dir = parts.slice(0, -1).join("/");
    const base = parts[parts.length - 1]!;
    if (!dirFiles.has(dir)) dirFiles.set(dir, []);
    dirFiles.get(dir)!.push(base);
    // ensure all ancestor dirs exist
    const segs = dir.split("/").filter(Boolean);
    for (let i = 1; i <= segs.length; i++) {
      const anc = segs.slice(0, i - 1).join("/");
      if (!dirFiles.has(anc)) dirFiles.set(anc, []);
    }
  }

  // ensure root dir present
  if (!dirFiles.has("")) dirFiles.set("", []);

  // build nodes: one per directory
  const dirs = Array.from(dirFiles.keys()).sort();
  const nodes: RouteSegment[] = [];

  for (const dir of dirs) {
    const segments = dir === "" ? [] : dir.split("/");
    const name = segments.length
      ? segments[segments.length - 1]!
      : normalizedAppRoot;
    // root handling
    const isRoot = dir === "";
    const classified = isRoot
      ? {
          kind: "root" as SegmentKind,
          urlSegment: "",
          dynamicParamNames: [] as string[],
          isIntercepted: false,
        }
      : classifyDirName(name);

    const files = [...(dirFiles.get(dir) ?? [])].sort();
    const fileRoles: FileRole[] = [];
    for (const f of files) {
      const role = classifyFileName(f);
      if (role) fileRoles.push(role);
    }

    const id = dir === "" ? "__root__" : dir;
    const parentId = isRoot
      ? null
      : segments.length === 1
        ? "__root__"
        : segments.slice(0, -1).join("/") || "__root__";
    const node: RouteSegment = {
      id,
      relativePath: dir,
      name,
      kind: isRoot ? "root" : classified.kind,
      parentId,
      urlSegment: isRoot ? "" : classified.urlSegment,
      dynamicParamNames: isRoot ? [] : classified.dynamicParamNames,
      isIntercepted: isRoot ? false : classified.isIntercepted,
      fileRoles,
      sourceLocation: {
        relativePath: `${appPrefix}${dir}${dir ? "/" : ""}${files[0] ?? ""}`,
        line: 1,
        column: 1,
      },
    };
    if (fileMetadata) {
      const executions = files
        .map(
          (file) =>
            fileMetadata[`${appPrefix}${dir}${dir ? "/" : ""}${file}`]
              ?.execution,
        )
        .filter((value): value is RouteExecution => value !== undefined);
      node.execution = executions.includes("client")
        ? "client"
        : executions.includes("server")
          ? "server"
          : "unknown";
    }
    if (classified.parallelSlot) node.parallelSlot = classified.parallelSlot;
    if (classified.interceptPrefix)
      node.interceptPrefix = classified.interceptPrefix;
    nodes.push(node);
  }

  // fix parentId references: ensure parent exists
  for (const n of nodes) {
    if (n.parentId && !nodes.find((x) => x.id === n.parentId)) {
      n.parentId = "__root__";
    }
  }

  return { rootId: "__root__", nodes };
}

export function buildUrlPattern(
  node: RouteSegment,
  nodes: RouteSegment[],
): string {
  const parts: string[] = [];
  let cur: RouteSegment | undefined = node;
  while (cur && cur.id !== "__root__") {
    if (
      cur.kind !== "group" &&
      cur.kind !== "parallel-slot" &&
      cur.urlSegment
    ) {
      parts.unshift(cur.urlSegment);
    }
    cur = nodes.find((n) => n.id === cur!.parentId);
  }
  return "/" + parts.join("/");
}
