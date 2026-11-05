import { describe, expect, it } from "vitest";
import {
	detectDependencyHook,
	extractComponentDependencies,
} from "./fiber-dependencies";

describe("detectDependencyHook", () => {
	it("detects external store", () => {
		const hook = { memoizedState: 1, queue: { getSnapshot: () => 1 } };
		const r = detectDependencyHook(hook as never, 0);
		expect(r.kind).toBe("external-store");
	});

	it("detects state via basicStateReducer", () => {
		function basicStateReducer(x: unknown) {
			return x;
		}
		const h = {
			memoizedState: 1,
			queue: { lastRenderedReducer: basicStateReducer },
		};
		const r = detectDependencyHook(h as never, 1);
		expect(r.kind).toBe("state");
	});

	it("detects reducer", () => {
		const reducer = function myReducer(x: unknown) {
			return x;
		};
		const hook = { memoizedState: 1, queue: { lastRenderedReducer: reducer } };
		const r = detectDependencyHook(hook as never, 2);
		expect(r.kind).toBe("reducer");
	});

	it("detects state via dispatch", () => {
		const hook = { memoizedState: 1, queue: { dispatch: () => undefined } };
		const r = detectDependencyHook(hook as never, 3);
		expect(r.kind).toBe("state");
	});

	it("detects effect", () => {
		const hook = {
			memoizedState: { deps: [1, 2], tag: 1, create: () => undefined },
		};
		const r = detectDependencyHook(hook as never, 4);
		expect(r.kind).toBe("effect");
	});

	it("detects callback", () => {
		const hook = { memoizedState: [() => 1, [1, 2]] };
		const r = detectDependencyHook(hook as never, 5);
		expect(r.kind).toBe("callback");
	});

	it("detects memo", () => {
		const hook = { memoizedState: [42, [1, 2]] };
		const r = detectDependencyHook(hook as never, 6);
		expect(r.kind).toBe("memo");
	});

	it("detects ref", () => {
		const hook = { memoizedState: { current: 5 } };
		const r = detectDependencyHook(hook as never, 7);
		expect(r.kind).toBe("ref");
	});

	it("detects other", () => {
		const hook = { memoizedState: "x" };
		const r = detectDependencyHook(hook as never, 8);
		expect(r.kind).toBe("other");
	});
});

describe("extractComponentDependencies", () => {
	it("extracts from minimal fiber", () => {
		const fiber = {
			tag: 0,
			type: function Demo() {},
			memoizedProps: { title: "Hello" },
			memoizedState: null,
		};
		const r = extractComponentDependencies(fiber as never, "c1", {
			maxNodes: 10,
		});
		expect(r.component.id).toBe("c1");
		expect(r.nodes.length).toBeGreaterThan(0);
	});

	it("handles null fiber state", () => {
		const fiber = {
			tag: 0,
			type: function Demo() {},
			memoizedProps: {},
			memoizedState: null,
		};
		const r = extractComponentDependencies(fiber as never, "c2", {
			maxNodes: 10,
			includeProviders: false,
		});
		expect(r).toBeTruthy();
	});
});
