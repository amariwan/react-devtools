/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
	it("renders", () => {
		const { container } = render(<Separator />);
		expect(container.firstChild).toBeTruthy();
	});
});
