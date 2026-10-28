import type { Availability } from "./availability.js";

export type CapabilitySource =
  "react" | "next" | "static" | "plugin" | "browser";
export type CapabilityPermission = "read" | "action" | "destructive";

export type Capability = {
  id: string; // e.g. "react.component.inspect"
  availability: Availability;
  reason?: string;
  source: CapabilitySource;
  permission: CapabilityPermission;
};

export type CapabilityRegistry = {
  provide(capability: Capability): void;
  require(id: string): Capability | undefined;
  list(): Capability[];
  has(id: string): boolean;
  onChange(listener: (caps: Capability[]) => void): () => void;
};

export type CapabilityNegotiationResult = {
  satisfied: string[];
  missing: string[];
  degraded: string[]; // present but partial/experimental
};
