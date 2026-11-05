import { decodeValue, encodeValue } from "@next-devtools/contracts";
import { describe, expect, it } from "vitest";

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

	it("truncates deep arrays", () => {
		const deep: unknown[] = [];
		let cur = deep;
		for (let i = 0; i < 20; i++) {
			const next: unknown[] = [];
			(cur as unknown[]).push(next);
			cur = next;
		}
		const enc = encodeValue(deep) as {
			__ndt_type: string;
			truncated?: boolean;
		};
		expect(enc.__ndt_type).toBe("array");
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

	it("round-trips regexp", () => {
		const r = /abc/gi;
		const enc = encodeValue(r) as { __ndt_type: string };
		expect(enc.__ndt_type).toBe("regexp");
		expect((decodeValue(enc) as RegExp).toString()).toBe(r.toString());
	});

	it("round-trips array", () => {
		const a = [1, "x", true];
		expect(decodeValue(encodeValue(a))).toEqual(a);
	});

	it("round-trips object", () => {
		const o = { a: 1, b: "x" };
		expect(decodeValue(encodeValue(o))).toEqual(o);
	});

	it("truncates deep objects", () => {
		const deep: Record<string, unknown> = {};
		let cur = deep;
		for (let i = 0; i < 20; i++) {
			cur.nested = {};
			cur = cur.nested as Record<string, unknown>;
		}
		const enc = encodeValue(deep) as {
			__ndt_type: string;
			truncated?: boolean;
		};
		expect(enc.__ndt_type).toBe("object");
	});

	it("decodes ref and function as undefined", () => {
		const refEnc = { __ndt_type: "ref", id: 1 } as never;
		const fnEnc = { __ndt_type: "function", name: "f" } as never;
		expect(decodeValue(refEnc)).toBeUndefined();
		expect(decodeValue(fnEnc)).toBeUndefined();
	});

	it("decodes symbol", () => {
		const sym = Symbol("desc");
		const enc = encodeValue(sym) as { __ndt_type: string };
		expect(enc.__ndt_type).toBe("symbol");
		expect(typeof decodeValue(enc)).toBe("symbol");
	});
});
