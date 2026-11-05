/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

describe("Select", () => {
	it("renders", () => {
		const { container } = render(
			<Select options={[{ label: "a", value: "a" }]} />,
		);
		expect(container.firstChild).toBeTruthy();
	});
});
