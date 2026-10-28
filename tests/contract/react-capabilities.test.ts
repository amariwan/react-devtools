import { describe, expect, it } from "vitest";
import { reactCapabilityDescriptors } from "@next-devtools/runtime-react";

describe("react capability descriptors", () => {
  it("publishes both capabilities as available for an available snapshot", () => {
    const capabilities = reactCapabilityDescriptors({ status: "available" });

    expect(capabilities).toEqual([
      {
        id: "react.component.inspect",
        availability: "available",
        source: "react",
        permission: "read",
      },
      {
        id: "react.component.source",
        availability: "available",
        source: "react",
        permission: "read",
      },
    ]);
  });

  it("publishes profiler only when the adapter exposes the commit signal", () => {
    const capabilities = reactCapabilityDescriptors({
      status: "available",
      data: {
        capabilities: {
          tree: false,
          props: false,
          hooks: false,
          source: false,
          profiler: true,
          selection: false,
        },
      },
    });

    expect(capabilities).toContainEqual({
      id: "react.profiler.commit-signal",
      availability: "available",
      source: "react",
      permission: "read",
    });
  });

  it("publishes partial capabilities with the snapshot reason", () => {
    const capabilities = reactCapabilityDescriptors({
      status: "unavailable",
      reason: "React adapter not connected",
    });

    expect(capabilities).toHaveLength(2);
    for (const capability of capabilities) {
      expect(capability.availability).toBe("partial");
      expect(capability.reason).toBe("React adapter not connected");
      expect(capability.source).toBe("react");
      expect(capability.permission).toBe("read");
    }
  });

  it("keeps error snapshots partial and omits an absent reason", () => {
    const [inspect, source] = reactCapabilityDescriptors({ status: "error" });

    expect(inspect).toMatchObject({
      id: "react.component.inspect",
      availability: "partial",
    });
    expect(inspect).not.toHaveProperty("reason");
    expect(source).toMatchObject({
      id: "react.component.source",
      availability: "partial",
    });
  });
});
