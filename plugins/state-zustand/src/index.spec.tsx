/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import * as mod from "./index";

describe("index barrel", () => {
	it("loads", () => {
		expect(mod).toBeTruthy();
	});
});
