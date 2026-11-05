import { describe, expect, it } from "vitest";
import * as server from "./server";

describe("server re-exports", () => {
	it("exports isDevEnvironment", () => {
		expect(typeof server.isDevEnvironment).toBe("function");
	});
});
