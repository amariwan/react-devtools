/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toolbar } from "./toolbar";

describe("Toolbar", () => {
	it("renders", () => {
		const { container } = render(<Toolbar />);
		expect(container.firstChild).toBeTruthy();
	});
});
