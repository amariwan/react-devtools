/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
	it("renders", () => {
		render(<IconButton icon={() => null} label="ib" />);
		expect(screen.getByRole("button")).toBeTruthy();
	});

	it("applies icon styling without rotating the button surface", () => {
		const { container } = render(
			<IconButton
				icon={(props) => <svg {...props} data-testid="icon" />}
				iconClassName="devtools:animate-spin"
				label="Loading"
			/>,
		);
		expect(
			screen.getByTestId("icon").classList.contains("devtools:animate-spin"),
		).toBe(true);
		expect(
			container
				.querySelector("button")
				?.classList.contains("devtools:animate-spin"),
		).toBe(false);
	});
});
