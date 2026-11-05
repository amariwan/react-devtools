import { describe, expect, it } from "vitest";
import { createEventBus } from "./event-bus";

describe("event bus", () => {
	it("delivers emitted payloads", () => {
		const bus = createEventBus();
		let received: unknown;
		bus.on("e", (p) => {
			received = p;
		});
		bus.emit("e", 42);
		expect(received).toBe(42);
	});

	it("unsubscribes via returned function", () => {
		const bus = createEventBus();
		let count = 0;
		const off = bus.on("e", () => {
			count += 1;
		});
		bus.emit("e", null);
		off();
		bus.emit("e", null);
		expect(count).toBe(1);
	});

	it("isolates listener errors", () => {
		const bus = createEventBus();
		let ok = false;
		bus.on("e", () => {
			throw new Error("boom");
		});
		bus.on("e", () => {
			ok = true;
		});
		bus.emit("e", null);
		expect(ok).toBe(true);
	});

	it("does nothing for unknown events", () => {
		const bus = createEventBus();
		expect(() => bus.emit("nope", 1)).not.toThrow();
	});

	it("off removes listener", () => {
		const bus = createEventBus();
		let count = 0;
		const listener = () => {
			count += 1;
		};
		bus.on("e", listener);
		bus.off("e", listener);
		bus.emit("e", null);
		expect(count).toBe(0);
	});

	it("off on unknown event is safe", () => {
		const bus = createEventBus();
		expect(() => bus.off("nope", () => undefined)).not.toThrow();
	});
});
