/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReactLogo } from "./react-logo";

describe("ReactLogo", () => {
	it("renders", () => {
		const { container } = render(<ReactLogo />);
		expect(container).toBeTruthy();
	});
});
