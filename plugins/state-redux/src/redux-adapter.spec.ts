import { describe, expect, it } from "vitest";
import { createReduxAdapter } from "./redux-adapter";

describe("redux adapter", () => {
	it("creates adapter", () => {
		const store = { getState: () => 1, subscribe: () => () => undefined };
		const a = createReduxAdapter(store);
		expect(a?.id).toBe("redux:default");
		expect(a?.read()).toBe(1);
	});

	it("returns undefined for invalid", () => {
		expect(createReduxAdapter({})).toBeUndefined();
	});
});
