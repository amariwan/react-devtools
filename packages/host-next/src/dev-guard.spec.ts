import { describe, expect, it } from "vitest";
import { SETUP_MARKER, devOnly, isDevEnvironment } from "./dev-guard";

describe("dev guard", () => {
	it("detects dev environment", () => {
		expect(isDevEnvironment({ NODE_ENV: "development" })).toBe(true);
		expect(isDevEnvironment({ NODE_ENV: "production" })).toBe(false);
		expect(isDevEnvironment({ NEXT_DEVTOOLS: "0" })).toBe(false);
		expect(isDevEnvironment({ NEXT_DEVTOOLS: "false" })).toBe(false);
	});

	it("devOnly returns null in prod", () => {
		const prev = process.env.NODE_ENV;
		process.env.NODE_ENV = "production";
		expect(devOnly(() => 42)).toBeNull();
		process.env.NODE_ENV = prev;
	});

	it("devOnly runs fn in dev", () => {
		expect(devOnly(() => 42)).toBe(42);
	});

	it("exports setup marker", () => {
		expect(SETUP_MARKER).toContain("setup");
	});
});
