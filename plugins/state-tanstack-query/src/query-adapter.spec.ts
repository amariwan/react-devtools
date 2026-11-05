import { describe, expect, it } from "vitest";
import { createQueryAdapter } from "./query-adapter";

describe("query adapter", () => {
	it("returns undefined for invalid", () => {
		expect(createQueryAdapter({})).toBeUndefined();
	});

	it("creates adapter for valid client", () => {
		const client = {
			getQueryCache: () => ({
				getAll: () => [
					{ queryKey: "k", state: { status: "success", data: 1 } },
				],
				subscribe: () => () => undefined,
			}),
		};
		const a = createQueryAdapter(client);
		expect(a).toBeTruthy();
		expect(Array.isArray(a?.read())).toBe(true);
	});
});
