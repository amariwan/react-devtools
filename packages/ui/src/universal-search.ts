export type UniversalSearchKind =
  "component" | "route" | "timeline" | "network" | "error";

export type UniversalSearchEntry = {
  readonly kind: UniversalSearchKind;
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly panelId: string;
};

export type UniversalSearchSnapshots = {
  readonly react?: { readonly tree?: readonly unknown[] };
  readonly routes?: {
    readonly pathname?: string;
    readonly tree?: { readonly nodes?: readonly unknown[] };
  };
  readonly timeline?: { readonly events?: readonly unknown[] };
  readonly network?: { readonly entries?: readonly unknown[] };
  readonly diagnostics?: { readonly events?: readonly unknown[] };
};

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function boundedEntries(
  entries: UniversalSearchEntry[],
  maxEntries: number,
): UniversalSearchEntry[] {
  return entries.slice(0, Math.max(1, Math.min(500, maxEntries)));
}

function addEntry(
  entries: UniversalSearchEntry[],
  entry: Omit<UniversalSearchEntry, "subtitle"> & {
    subtitle: string | undefined;
  },
): void {
  const { subtitle, ...rest } = entry;
  entries.push({
    ...rest,
    ...(subtitle ? { subtitle } : {}),
  });
}

export function buildUniversalSearchEntries(
  snapshots: UniversalSearchSnapshots,
  maxEntries = 200,
): UniversalSearchEntry[] {
  const entries: UniversalSearchEntry[] = [];

  for (const node of snapshots.react?.tree ?? []) {
    const value = record(node);
    const id = text(value?.id);
    const displayName = text(value?.displayName);
    if (!id || !displayName) continue;
    addEntry(entries, {
      kind: "component",
      id: `component:${id}`,
      title: displayName,
      subtitle: text(value?.kind),
      panelId: "components",
    });
  }

  for (const node of snapshots.routes?.tree?.nodes ?? []) {
    const value = record(node);
    const id = text(value?.id);
    const name = text(value?.name) ?? text(value?.relativePath);
    if (!id || !name) continue;
    addEntry(entries, {
      kind: "route",
      id: `route:${id}`,
      title: name,
      subtitle: text(value?.relativePath),
      panelId: "pages",
    });
  }

  for (const event of snapshots.timeline?.events ?? []) {
    const value = record(event);
    const id = text(value?.id);
    const layer = text(value?.layer);
    const type = text(value?.type);
    if (!id || !layer || !type) continue;
    addEntry(entries, {
      kind: "timeline",
      id: `timeline:${id}`,
      title: `${layer} · ${type}`,
      subtitle: text(value?.timestampUnixMs),
      panelId: "timeline",
    });
  }

  for (const request of snapshots.network?.entries ?? []) {
    const value = record(request);
    const id = text(value?.id);
    const url = text(value?.url);
    if (!id || !url) continue;
    addEntry(entries, {
      kind: "network",
      id: `network:${id}`,
      title: url,
      subtitle: text(value?.initiatorType),
      panelId: "network",
    });
  }

  for (const diagnostic of snapshots.diagnostics?.events ?? []) {
    const value = record(diagnostic);
    const id = text(value?.id);
    const message = text(value?.message);
    if (!id || !message) continue;
    addEntry(entries, {
      kind: "error",
      id: `error:${id}`,
      title: message,
      subtitle: text(value?.kind),
      panelId: "agent-mcp",
    });
  }

  return boundedEntries(entries, maxEntries);
}
