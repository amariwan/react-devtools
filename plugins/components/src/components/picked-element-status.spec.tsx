/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PickedElementStatus } from "./picked-element-status";

describe("PickedElementStatus", () => {
	it("renders null tag", () => {
		const { container } = render(
			<PickedElementStatus tag={null} sourceOrigin={null} sourceRole={null} />,
		);
		expect(container).toBeTruthy();
	});
});
