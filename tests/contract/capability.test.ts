import { describe, it, expect } from "vitest";
import { createCapabilityRegistry } from "@next-devtools/core";
import type { Capability } from "@next-devtools/contracts";

describe("capability registry", () => {
  it("provides and requires capabilities", () => {
    const reg = createCapabilityRegistry();
    const cap: Capability = {
      id: "react.component.inspect",
      availability: "available",
      source: "react",
      permission: "read",
    };
    reg.provide(cap);
    expect(reg.has("react.component.inspect")).toBe(true);
    expect(reg.require("react.component.inspect")).toEqual(cap);
  });

  it("notifies on change", () => {
    const reg = createCapabilityRegistry();
    const seen: number[] = [];
    const unsub = reg.onChange((caps) => seen.push(caps.length));
    reg.provide({
      id: "a",
      availability: "available",
      source: "react",
      permission: "read",
    });
    expect(seen).toEqual([1]);
    unsub();
    reg.provide({
      id: "b",
      availability: "available",
      source: "react",
      permission: "read",
    });
    expect(seen).toEqual([1]);
  });

  it("does not notify when a capability is re-published unchanged", () => {
    const reg = createCapabilityRegistry();
    let notifications = 0;
    reg.onChange(() => {
      notifications++;
    });
    const cap: Capability = {
      id: "react.component.inspect",
      availability: "available",
      source: "react",
      permission: "read",
    };

    reg.provide(cap);
    reg.provide({ ...cap });

    expect(notifications).toBe(1);
  });

  it("lists all", () => {
    const reg = createCapabilityRegistry();
    reg.provide({
      id: "x",
      availability: "partial",
      source: "static",
      permission: "read",
    });
    expect(reg.list().length).toBe(1);
  });
});
