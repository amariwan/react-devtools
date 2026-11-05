import { describe, expect, it } from "vitest";
import { createZustandAdapter } from "./zustand-adapter";

describe("zustand adapter", () => {
	it("creates adapter for valid store", () => {
		const store = {
			getState: () => ({ a: 1 }),
			subscribe: () => () => undefined,
		};
		const a = createZustandAdapter(store, 0);
		expect(a).toBeTruthy();
		expect(a?.read()).toEqual({ a: 1 });
	});

	it("returns undefined for invalid store", () => {
		expect(createZustandAdapter({}, 0)).toBeUndefined();
	});
});
