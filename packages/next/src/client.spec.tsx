/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NextDevtools } from "./client";

describe("NextDevtools", () => {
	it("renders children", () => {
		const { container } = render(
			<NextDevtools enabled={false}>
				<span>hi</span>
			</NextDevtools>,
		);
		expect(container).toBeTruthy();
	});
});
