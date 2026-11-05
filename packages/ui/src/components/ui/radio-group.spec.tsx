/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "./radio-group";

describe("RadioGroup", () => {
	it("renders", () => {
		render(
			<RadioGroup>
				<RadioGroupItem value="a" aria-label="a" />
			</RadioGroup>,
		);
		expect(screen.getByRole("radio")).toBeTruthy();
	});
});
