/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
	it("renders", () => {
		render(<Input placeholder="x" />);
		const input = screen.getByPlaceholderText("x");
		expect(input).toBeTruthy();
		expect(input.className).toContain("devtools:text-foreground");
	});

	it("accepts input", async () => {
		const user = userEvent.setup();
		render(<Input placeholder="x" />);
		const el = screen.getByPlaceholderText("x") as HTMLInputElement;
		await user.type(el, "hi");
		expect(el.value).toBe("hi");
	});
});
