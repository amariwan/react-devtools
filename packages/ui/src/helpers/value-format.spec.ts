import { describe, expect, it } from "vitest";
import { childrenOf, summarizeValue } from "./value-format";

describe("value format", () => {
	it("summarizes primitives", () => {
		expect(summarizeValue(null).kind).toBe("null");
		expect(summarizeValue(42).kind).toBe("number");
		expect(summarizeValue("hi").kind).toBe("string");
		expect(summarizeValue(true).kind).toBe("boolean");
	});

	it("summarizes undefined encoded", () => {
		expect(summarizeValue({ __ndt_type: "undefined" } as never).kind).toBe(
			"undefined",
		);
	});

	it("summarizes ref", () => {
		expect(summarizeValue({ __ndt_type: "ref", path: "$" } as never).kind).toBe(
			"ref",
		);
	});

	it("summarizes error", () => {
		expect(
			summarizeValue({ __ndt_type: "error", name: "E", message: "m" } as never)
				.kind,
		).toBe("error");
	});

	it("summarizes symbol", () => {
		expect(
			summarizeValue({ __ndt_type: "symbol", description: "d" } as never).kind,
		).toBe("symbol");
		expect(
			summarizeValue({ __ndt_type: "symbol", description: null } as never)
				.label,
		).toBe("Symbol()");
	});

	it("summarizes function", () => {
		expect(
			summarizeValue({ __ndt_type: "function", name: "f" } as never).kind,
		).toBe("function");
	});

	it("summarizes unknown as object", () => {
		expect(summarizeValue({ __ndt_type: "nope" } as never).kind).toBe("object");
	});

	it("childrenOf returns children for collections", () => {
		expect(
			childrenOf({ __ndt_type: "array", items: [1, 2] } as never),
		).toHaveLength(2);
		expect(
			childrenOf({ __ndt_type: "set", values: [1, 2] } as never),
		).toHaveLength(2);
		expect(
			childrenOf({ __ndt_type: "object", entries: [["a", 1]] } as never),
		).toHaveLength(1);
		expect(childrenOf(null)).toEqual([]);
	});
});
