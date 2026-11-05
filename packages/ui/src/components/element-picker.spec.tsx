/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ElementHighlight } from "./element-picker";

describe("element picker", () => {
	it("renders null element", () => {
		const { container } = render(<ElementHighlight element={null} />);
		expect(container).toBeTruthy();
	});
});
