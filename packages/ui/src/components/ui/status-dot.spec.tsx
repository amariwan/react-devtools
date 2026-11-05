/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./status-dot";

describe("StatusDot", () => {
	it("renders", () => {
		const { container } = render(<StatusDot status="available" />);
		expect(container.firstChild).toBeTruthy();
	});
});
