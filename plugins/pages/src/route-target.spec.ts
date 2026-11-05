import { describe, expect, it } from "vitest";
import { resolveRouteTarget } from "./route-target";

describe("route target", () => {
	it("resolves static pattern", () => {
		const page = {
			id: "1",
			urlPattern: "/about",
			dynamicParamNames: [],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		expect(resolveRouteTarget(page, {})).toBe("/about");
	});

	it("resolves dynamic param", () => {
		const page = {
			id: "1",
			urlPattern: "/users/[id]",
			dynamicParamNames: ["id"],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		expect(resolveRouteTarget(page, { id: "42" })).toBe("/users/42");
	});

	it("returns null when a param cannot be resolved", () => {
		const page = {
			id: "1",
			urlPattern: "/users/[slug]",
			dynamicParamNames: ["id"],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		expect(resolveRouteTarget(page, { id: "42" })).toBeNull();
	});
});
