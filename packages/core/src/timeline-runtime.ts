import type {
  RuntimeService,
  RuntimeServiceSnapshot,
} from "@next-devtools/contracts";
import type {
  TimelineLayer,
  TimelineRegistry,
} from "@next-devtools/plugin-sdk";
import {
  createTimelineStore,
  type TimelineEvent,
  type TimelineFilter,
} from "./timeline-store.js";

export interface TimelineRuntimeSnapshot {
  readonly recording: boolean;
  readonly layers: readonly TimelineLayer[];
  readonly events: readonly TimelineEvent[];
  readonly filter: Readonly<TimelineFilter>;
  readonly dropped: number;
}

export interface TimelineRuntime
  extends TimelineRegistry, RuntimeService<TimelineRuntimeSnapshot> {
  /** Record an event without synchronously notifying React subscribers. */
  emitSilently(event: {
    layer: string;
    type: string;
    payload: unknown;
    timestampUnixMs?: number;
  }): void;
  /** Refresh the immutable snapshot after silent ingestion. */
  refresh(): void;
  startRecording(): void;
  stopRecording(): void;
  setFilter(filter: TimelineFilter): void;
  clear(): void;
  dispose(): void;
}

export function createTimelineRuntime(options?: {
  capacity?: number;
  now?: () => number;
}): TimelineRuntime {
  const capacity = options?.capacity ?? 5000;
  const now = options?.now ?? Date.now;
  const store = createTimelineStore(capacity);
  const layers = new Map<string, { readonly value: TimelineLayer }>();
  const listeners = new Set<() => void>();
  let recording = false;
  let filter: TimelineFilter = {};
  let revision = 0;
  let disposed = false;
  let snapshot: RuntimeServiceSnapshot<TimelineRuntimeSnapshot> =
    buildSnapshot();

  function buildSnapshot(): RuntimeServiceSnapshot<TimelineRuntimeSnapshot> {
    return {
      status: disposed ? "unavailable" : "available",
      data: {
        recording,
        layers: Array.from(layers.values(), ({ value }) => value),
        events: store.list(filter, undefined, Number.MAX_SAFE_INTEGER).items,
        filter: { ...filter },
        dropped: store.droppedCount(),
      },
      revision,
    };
  }

  function notify() {
    revision++;
    snapshot = buildSnapshot();
    for (const listener of listeners) listener();
  }

  function record(event: Parameters<TimelineRegistry["emit"]>[0]): void {
    if (!recording || disposed) return;
    store.emit({
      ...event,
      timestampUnixMs: event.timestampUnixMs ?? now(),
    });
  }

  return {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    registerLayer(layer) {
      if (disposed) return { unregister: () => undefined };
      const registration = { value: layer };
      layers.set(layer.id, registration);
      notify();
      return {
        unregister() {
          if (layers.get(layer.id) !== registration) return;
          layers.delete(layer.id);
          notify();
        },
      };
    },
    listLayers() {
      return Array.from(layers.values(), ({ value }) => value);
    },
    emit(event) {
      record(event);
      notify();
    },
    emitSilently(event) {
      record(event);
    },
    refresh() {
      if (disposed) return;
      snapshot = buildSnapshot();
    },
    startRecording() {
      if (recording || disposed) return;
      recording = true;
      notify();
    },
    stopRecording() {
      if (!recording) return;
      recording = false;
      notify();
    },
    setFilter(nextFilter) {
      if (disposed) return;
      filter = {
        ...nextFilter,
        ...(nextFilter.layers ? { layers: [...nextFilter.layers] } : {}),
        ...(nextFilter.types ? { types: [...nextFilter.types] } : {}),
      };
      notify();
    },
    clear() {
      if (disposed) return;
      store.clear();
      notify();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      recording = false;
      layers.clear();
      store.clear();
      revision++;
      snapshot = buildSnapshot();
      listeners.clear();
    },
  };
}
