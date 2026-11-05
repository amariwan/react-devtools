/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToggleGroup } from "./toggle-group";

describe("ToggleGroup", () => {
	it("renders", () => {
		const { container } = render(<ToggleGroup />);
		expect(container.firstChild).toBeTruthy();
	});
});
