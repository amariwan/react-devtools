/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

describe("Select", () => {
	it("renders", () => {
		const { container } = render(
			<Select options={[{ label: "a", value: "a" }]} />,
		);
		expect(container.firstChild).toBeTruthy();
	});

	it("supports disabled options", () => {
		render(
			<Select
				value=""
				label="Store adapter"
				options={[
					{ label: "Select a store", value: "", disabled: true },
					{ label: "Primary", value: "primary" },
				]}
				onChange={() => undefined}
			/>,
		);

		expect(
			screen
				.getByRole("option", { name: "Select a store" })
				.getAttribute("disabled"),
		).not.toBeNull();
	});
});
