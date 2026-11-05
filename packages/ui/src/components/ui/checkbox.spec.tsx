/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";
import "@testing-library/jest-dom";

describe("Checkbox", () => {
	it("renders", () => {
		render(<Checkbox aria-label="cb" />);
		expect(screen.getByRole("checkbox")).toBeTruthy();
	});

	it("toggles", async () => {
		const user = userEvent.setup();
		render(<Checkbox aria-label="cb" />);
		const cb = screen.getByRole("checkbox");
		await user.click(cb);
		expect(cb).toBeChecked();
	});
});
