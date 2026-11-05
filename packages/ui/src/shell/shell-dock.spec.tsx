/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dock } from "./shell-dock";

describe("Dock", () => {
	it("renders", () => {
		const { container } = render(<Dock>content</Dock>);
		expect(container.firstChild).toBeTruthy();
	});
});
