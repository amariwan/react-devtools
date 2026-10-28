import { describe, it, expect } from "vitest";
import { encodeValue, decodeValue } from "@next-devtools/contracts";

describe("value codec", () => {
  it("round-trips primitives", () => {
    expect(decodeValue(encodeValue(42))).toBe(42);
    expect(decodeValue(encodeValue("hello"))).toBe("hello");
    expect(decodeValue(encodeValue(true))).toBe(true);
    expect(decodeValue(encodeValue(null))).toBeNull();
  });

  it("encodes undefined", () => {
    expect(encodeValue(undefined)).toEqual({ __ndt_type: "undefined" });
    expect(decodeValue(encodeValue(undefined))).toBeUndefined();
  });

  it("encodes bigint", () => {
    const b = 9007199254740993n;
    const enc = encodeValue(b) as { __ndt_type: string; value: string };
    expect(enc.__ndt_type).toBe("bigint");
    expect(decodeValue(enc)).toBe(b);
  });

  it("encodes Date", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    const enc = encodeValue(d) as { __ndt_type: string };
    expect(enc.__ndt_type).toBe("date");
    expect((decodeValue(enc) as Date).toISOString()).toBe(d.toISOString());
  });

  it("encodes Error", () => {
    const e = new Error("boom");
    const enc = encodeValue(e) as { __ndt_type: string; message: string };
    expect(enc.__ndt_type).toBe("error");
    expect(enc.message).toBe("boom");
    expect((decodeValue(enc) as Error).message).toBe("boom");
  });

  it("handles cycles without throwing", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    const enc = encodeValue(obj) as { __ndt_type: string; entries: unknown[] };
    expect(enc.__ndt_type).toBe("object");
    // the self ref becomes a ref marker
    const selfEntry = enc.entries.find(
      (e) => (e as [string, unknown])[0] === "self",
    ) as [string, unknown];
    expect((selfEntry[1] as { __ndt_type: string }).__ndt_type).toBe("ref");
  });

  it("truncates large arrays", () => {
    const arr = Array.from({ length: 500 }, (_, i) => i);
    const enc = encodeValue(arr) as {
      __ndt_type: string;
      items: unknown[];
      truncated?: boolean;
    };
    expect(enc.truncated).toBe(true);
    expect(enc.items.length).toBe(200);
  });

  it("encodes Map and Set", () => {
    const m = new Map([["a", 1]]);
    const s = new Set([1, 2]);
    const menc = encodeValue(m) as { __ndt_type: string };
    const senc = encodeValue(s) as { __ndt_type: string };
    expect(menc.__ndt_type).toBe("map");
    expect(senc.__ndt_type).toBe("set");
    expect(decodeValue(menc) instanceof Map).toBe(true);
    expect(decodeValue(senc) instanceof Set).toBe(true);
  });
});
