import { describe, expect, it } from "vitest";
import { loadDebugSessions, saveDebugSessions } from "./debug-session-storage";

describe("debug session storage", () => {
	it("loads empty when no storage", () => {
		expect(loadDebugSessions(undefined)).toEqual([]);
	});

	it("loads empty when storage empty", () => {
		const storage = { getItem: () => null } as never;
		expect(loadDebugSessions(storage)).toEqual([]);
	});

	it("loads sessions from storage", () => {
		const session = {
			sessionId: "s1",
			capturedAtUnixMs: 1,
			timeline: [],
			network: [],
			diagnostics: [],
			profiler: {
				commits: [],
				ranked: [],
				totalActualDuration: 0,
				totalBaseDuration: 0,
				maxActualDuration: 0,
			},
		};
		const storage = { getItem: () => JSON.stringify([session]) } as never;
		const loaded = loadDebugSessions(storage);
		expect(loaded).toHaveLength(1);
	});

	it("filters invalid sessions", () => {
		const storage = { getItem: () => JSON.stringify([{ bad: true }]) } as never;
		expect(loadDebugSessions(storage)).toEqual([]);
	});

	it("handles parse error", () => {
		const storage = { getItem: () => "{bad" } as never;
		expect(loadDebugSessions(storage)).toEqual([]);
	});

	it("handles non-array", () => {
		const storage = { getItem: () => JSON.stringify({ a: 1 }) } as never;
		expect(loadDebugSessions(storage)).toEqual([]);
	});

	it("saves sessions", () => {
		let saved = "";
		const storage = {
			getItem: () => null,
			setItem: (_k: string, v: string) => {
				saved = v;
			},
		} as never;
		const session = {
			sessionId: "s1",
			capturedAtUnixMs: 1,
			timeline: [],
			network: [],
			diagnostics: [],
			profiler: {
				commits: [],
				ranked: [],
				totalActualDuration: 0,
				totalBaseDuration: 0,
				maxActualDuration: 0,
			},
		};
		saveDebugSessions(storage, [session as never]);
		expect(saved).toBeTruthy();
	});

	it("does nothing with no storage", () => {
		expect(() => saveDebugSessions(undefined, [])).not.toThrow();
	});

	it("skips oversized payload", () => {
		let saved = "";
		const storage = {
			getItem: () => null,
			setItem: (_k: string, v: string) => {
				saved = v;
			},
		} as never;
		const big = "x".repeat(400000);
		const session = {
			sessionId: big,
			capturedAtUnixMs: 1,
			timeline: [],
			network: [],
			diagnostics: [],
			profiler: {
				commits: [],
				ranked: [],
				totalActualDuration: 0,
				totalBaseDuration: 0,
				maxActualDuration: 0,
			},
		};
		saveDebugSessions(storage, [session as never]);
		expect(saved).toBe("");
	});

	it("handles storage setItem throw", () => {
		const storage = {
			getItem: () => null,
			setItem: () => {
				throw new Error("quota");
			},
		} as never;
		const session = {
			sessionId: "s1",
			capturedAtUnixMs: 1,
			timeline: [],
			network: [],
			diagnostics: [],
			profiler: {
				commits: [],
				ranked: [],
				totalActualDuration: 0,
				totalBaseDuration: 0,
				maxActualDuration: 0,
			},
		};
		expect(() => saveDebugSessions(storage, [session as never])).not.toThrow();
	});
});
