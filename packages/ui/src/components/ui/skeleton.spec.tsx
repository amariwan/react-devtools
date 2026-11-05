/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
	it("renders", () => {
		const { container } = render(<Skeleton />);
		expect(container.firstChild).toBeTruthy();
	});
});
