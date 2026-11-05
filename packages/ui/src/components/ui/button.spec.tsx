/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import "@testing-library/jest-dom";

describe("Button", () => {
	it("renders children", () => {
		render(<Button>Click me</Button>);
		expect(screen.getByText("Click me")).toBeTruthy();
	});

	it("fires onClick", async () => {
		const user = userEvent.setup();
		let clicked = 0;
		render(
			<Button
				onClick={() => {
					clicked += 1;
				}}
			>
				Go
			</Button>,
		);
		await user.click(screen.getByText("Go"));
		expect(clicked).toBe(1);
	});

	it("supports disabled", () => {
		render(<Button disabled>Disabled</Button>);
		expect(screen.getByText("Disabled")).toHaveAttribute("disabled");
	});
});
