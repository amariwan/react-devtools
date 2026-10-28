import type { Capability, CapabilityRegistry } from "@next-devtools/contracts";

export function createCapabilityRegistry(): CapabilityRegistry {
  const caps = new Map<string, Capability>();
  const listeners = new Set<(caps: Capability[]) => void>();

  function sameCapability(left: Capability, right: Capability): boolean {
    return (
      left.id === right.id &&
      left.availability === right.availability &&
      left.reason === right.reason &&
      left.source === right.source &&
      left.permission === right.permission
    );
  }

  function notify() {
    const list = Array.from(caps.values());
    for (const l of listeners) l(list);
  }

  return {
    provide(capability) {
      const previous = caps.get(capability.id);
      if (previous && sameCapability(previous, capability)) return;
      caps.set(capability.id, capability);
      notify();
    },
    require(id) {
      return caps.get(id);
    },
    list() {
      return Array.from(caps.values());
    },
    has(id) {
      return caps.has(id);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
