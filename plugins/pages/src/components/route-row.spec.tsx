/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteRow } from "./route-row";

describe("RouteRow", () => {
	it("renders", () => {
		const page = {
			id: "1",
			urlPattern: "/about",
			dynamicParamNames: [],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		const { container } = render(
			<RouteRow page={page} values={{}} active={false} />,
		);
		expect(container).toBeTruthy();
	});
});
