/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Slider } from "./slider";

describe("Slider", () => {
	it("renders", () => {
		const { container } = render(<Slider defaultValue={[50]} />);
		expect(container.firstChild).toBeTruthy();
	});
});
