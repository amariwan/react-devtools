/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import * as primitives from "./primitives";

describe("primitives barrel", () => {
	it("loads", () => {
		expect(primitives).toBeTruthy();
	});
});
