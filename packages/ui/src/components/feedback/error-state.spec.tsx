/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorState } from "./error-state";

describe("ErrorState", () => {
	it("renders title", () => {
		render(<ErrorState title="boom" />);
		expect(screen.getByText("boom")).toBeTruthy();
		expect(screen.getByRole("alert").className).toContain("devtools:py-8");
	});
});
