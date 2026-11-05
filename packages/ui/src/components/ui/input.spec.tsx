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
		expect(screen.getByPlaceholderText("x")).toBeTruthy();
	});

	it("accepts input", async () => {
		const user = userEvent.setup();
		render(<Input placeholder="x" />);
		const el = screen.getByPlaceholderText("x") as HTMLInputElement;
		await user.type(el, "hi");
		expect(el.value).toBe("hi");
	});
});
