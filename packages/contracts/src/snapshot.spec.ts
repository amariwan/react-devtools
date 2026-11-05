import { describe, expect, it } from "vitest";
import { makeCursor, makeHandle } from "./snapshot";

describe("snapshot helpers", () => {
	it("makeCursor returns branded string", () => {
		const c = makeCursor("abc");
		expect(c).toBe("abc");
	});

	it("makeHandle returns branded string", () => {
		const h = makeHandle("h1");
		expect(h).toBe("h1");
	});
});
