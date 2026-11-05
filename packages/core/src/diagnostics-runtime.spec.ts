import { describe, expect, it } from "vitest";
import {
	createDiagnosticsRuntime,
	parseRuntimeStackFrame,
} from "./diagnostics-runtime";

describe("diagnostics runtime", () => {
	it("parses parenthesized frame", () => {
		const r = parseRuntimeStackFrame("Error\n    at foo (http://x.js:10:5)");
		expect(r?.sourceFrame.line).toBe(10);
		expect(r?.sourceFrame.column).toBe(5);
		expect(r?.sourceFrame.functionName).toBe("foo");
	});

	it("returns undefined for empty stack", () => {
		expect(parseRuntimeStackFrame("")).toBeUndefined();
	});

	it("parses bare frame", () => {
		const r = parseRuntimeStackFrame("at http://x.js:2:3");
		expect(r?.sourceFrame.line).toBe(2);
	});

	describe("createDiagnosticsRuntime", () => {
		it("records and lists", () => {
			const d = createDiagnosticsRuntime({ capacity: 2, now: () => 5 });
			d.record({ kind: "error", error: new Error("boom") });
			expect(d.getSnapshot().data.events).toHaveLength(1);
			expect(d.getSnapshot().data.events[0].timestampUnixMs).toBe(5);
		});

		it("drops when over capacity", () => {
			const d = createDiagnosticsRuntime({ capacity: 1 });
			d.record({ kind: "error", error: new Error("a") });
			d.record({ kind: "error", error: new Error("b") });
			expect(d.getSnapshot().data.events).toHaveLength(1);
			expect(d.getSnapshot().data.dropped).toBe(1);
		});

		it("clears", () => {
			const d = createDiagnosticsRuntime();
			d.record({ kind: "error", error: new Error("a") });
			d.clear();
			expect(d.getSnapshot().data.events).toHaveLength(0);
		});

		it("disposes", () => {
			const d = createDiagnosticsRuntime();
			d.dispose();
			expect(d.getSnapshot().status).toBe("unavailable");
		});

		it("subscribes", () => {
			const d = createDiagnosticsRuntime();
			let called = 0;
			const off = d.subscribe(() => {
				called += 1;
			});
			d.record({ kind: "error", error: new Error("a") });
			expect(called).toBeGreaterThan(0);
			off();
		});
	});
});
