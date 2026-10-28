import type {
  RuntimeService,
  RuntimeServiceSnapshot,
  RuntimeServiceStatus,
} from "@next-devtools/contracts";
import type {
  ComponentDetail,
  ComponentNode,
  ReactBridgeAdapter,
  ReactBridgeCapability,
  ReactCommitEvent,
  SuspenseBoundary,
} from "./react-bridge.js";

export interface ReactRuntimeSnapshot {
  readonly capabilities: Readonly<ReactBridgeCapability>;
  readonly roots: readonly string[];
  readonly tree: readonly ComponentNode[];
  readonly detail?: Readonly<ComponentDetail>;
  readonly source?: Readonly<{ file: string; line: number; column: number }>;
  readonly selectedComponentId?: string;
  readonly suspense?: readonly SuspenseBoundary[];
}

export interface ReactRuntimeService extends RuntimeService<ReactRuntimeSnapshot> {
  setAdapter(adapter?: ReactBridgeAdapter): void;
  refreshRoots(): Promise<string[]>;
  readTree(rootId: string): Promise<ComponentNode[]>;
  readDetail(id: string): Promise<ComponentDetail | undefined>;
  readSource(
    id: string,
  ): Promise<{ file: string; line: number; column: number } | undefined>;
  selectComponent(id: string): void;
  selectByDomNode(node: unknown): Promise<string | undefined>;
  readSuspenseBoundaries(rootId: string): Promise<SuspenseBoundary[]>;
  subscribeToCommits(listener: (event: ReactCommitEvent) => void): () => void;
  dispose(): void;
}

const unavailableCapabilities: ReactBridgeCapability = {
  tree: false,
  props: false,
  hooks: false,
  source: false,
  profiler: false,
  selection: false,
};

export function createReactRuntimeService(
  initialAdapter?: ReactBridgeAdapter,
): ReactRuntimeService {
  const listeners = new Set<() => void>();
  let adapter: ReactBridgeAdapter | undefined;
  let unsubscribeAdapter: (() => void) | undefined;
  let disposed = false;
  let generation = 0;
  let revision = 0;
  let status: RuntimeServiceStatus = "unavailable";
  let reason: string | undefined = "React adapter not connected";
  let capabilities: ReactBridgeCapability = unavailableCapabilities;
  let roots: string[] = [];
  let treeRootId: string | undefined;
  let tree: ComponentNode[] = [];
  let detail: ComponentDetail | undefined;
  let source: { file: string; line: number; column: number } | undefined;
  let selectedComponentId: string | undefined;
  let suspense: SuspenseBoundary[] = [];
  const requestRevision = {
    roots: 0,
    tree: 0,
    detail: 0,
    source: 0,
    selection: 0,
    suspense: 0,
  };
  let snapshot: RuntimeServiceSnapshot<ReactRuntimeSnapshot> = buildSnapshot();

  function buildSnapshot(): RuntimeServiceSnapshot<ReactRuntimeSnapshot> {
    return {
      status,
      data: {
        capabilities: { ...capabilities },
        roots: [...roots],
        tree: [...tree],
        ...(detail ? { detail } : {}),
        ...(source ? { source } : {}),
        ...(selectedComponentId ? { selectedComponentId } : {}),
        ...(suspense.length > 0 ? { suspense: [...suspense] } : {}),
      },
      ...(reason ? { reason } : {}),
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  function resetData() {
    capabilities = unavailableCapabilities;
    roots = [];
    treeRootId = undefined;
    tree = [];
    detail = undefined;
    source = undefined;
    selectedComponentId = undefined;
    suspense = [];
  }

  function detachAdapter() {
    const previous = adapter;
    adapter = undefined;
    const unsubscribe = unsubscribeAdapter;
    unsubscribeAdapter = undefined;
    try {
      unsubscribe?.();
    } catch {
      /* isolate adapter cleanup */
    }
    try {
      previous?.dispose?.();
    } catch {
      /* isolate adapter cleanup */
    }
  }

  function setError(error: unknown) {
    status = "error";
    reason = error instanceof Error ? error.message : String(error);
    notify();
  }

  async function read<T>(
    kind: keyof typeof requestRevision,
    fallback: T,
    operation: (current: ReactBridgeAdapter) => T | Promise<T>,
    apply: (value: T) => void,
  ): Promise<T> {
    const current = adapter;
    if (!current || status === "unavailable" || disposed) return fallback;
    const currentGeneration = generation;
    const currentRequest = ++requestRevision[kind];
    try {
      const value = await operation(current);
      if (
        adapter !== current ||
        generation !== currentGeneration ||
        requestRevision[kind] !== currentRequest
      ) {
        return fallback;
      }
      apply(value);
      status = "available";
      reason = undefined;
      notify();
      return value;
    } catch (error) {
      if (
        adapter === current &&
        generation === currentGeneration &&
        requestRevision[kind] === currentRequest
      ) {
        setError(error);
      }
      return fallback;
    }
  }

  const service: ReactRuntimeService = {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setAdapter(nextAdapter) {
      if (disposed || adapter === nextAdapter) return;
      generation++;
      detachAdapter();
      resetData();
      adapter = nextAdapter;
      if (!nextAdapter) {
        status = "unavailable";
        reason = "React adapter not connected";
        notify();
        return;
      }
      try {
        if (!nextAdapter.isAvailable()) {
          status = "unavailable";
          reason = "React adapter unavailable";
        } else {
          capabilities = { ...nextAdapter.getCapabilities() };
          status = "available";
          reason = undefined;
          unsubscribeAdapter = nextAdapter.subscribe?.(() => {
            // Keep the visible tree live: refresh roots, then re-read the tree
            // the UI is currently showing (falls back to the first root).
            void (async () => {
              const nextRoots = await service.refreshRoots();
              const rootId = treeRootId ?? nextRoots[0];
              if (rootId) await service.readTree(rootId);
            })();
          });
        }
      } catch (error) {
        status = "error";
        reason = error instanceof Error ? error.message : String(error);
      }
      notify();
    },
    refreshRoots() {
      return read(
        "roots",
        [],
        (current) => current.getRoots(),
        (value) => {
          roots = [...value];
        },
      );
    },
    readTree(rootId) {
      return read(
        "tree",
        [],
        (current) => current.getTree(rootId),
        (value) => {
          treeRootId = rootId;
          tree = [...value];
        },
      );
    },
    readDetail(id) {
      return read(
        "detail",
        undefined,
        (current) => current.getDetail(id),
        (value) => {
          detail = value;
        },
      );
    },
    readSource(id) {
      return read(
        "source",
        undefined,
        (current) => current.getSource(id),
        (value) => {
          source = value;
        },
      );
    },
    selectComponent(id) {
      if (disposed || selectedComponentId === id) return;
      selectedComponentId = id;
      notify();
    },
    selectByDomNode(node) {
      return read(
        "selection",
        undefined,
        (current) => current.selectByDomNode(node),
        (value) => {
          selectedComponentId = value;
        },
      );
    },
    readSuspenseBoundaries(rootId) {
      return read(
        "suspense",
        [],
        (current) => current.getSuspenseBoundaries?.(rootId) ?? [],
        (value) => {
          suspense = [...value];
        },
      );
    },
    subscribeToCommits(listener) {
      if (disposed) return () => undefined;
      return adapter?.subscribeToCommits?.(listener) ?? (() => undefined);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      detachAdapter();
      resetData();
      status = "unavailable";
      reason = "React runtime disposed";
      revision++;
      snapshot = buildSnapshot();
      listeners.clear();
    },
  };

  if (initialAdapter) service.setAdapter(initialAdapter);
  return service;
}
