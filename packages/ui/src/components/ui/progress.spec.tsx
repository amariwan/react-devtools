/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./progress";

describe("Progress", () => {
	it("renders", () => {
		const { container } = render(<Progress value={50} />);
		expect(container.firstChild).toBeTruthy();
	});
});
