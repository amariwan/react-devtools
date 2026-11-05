/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
	it("renders", () => {
		render(<IconButton icon={() => null} label="ib" />);
		expect(screen.getByRole("button")).toBeTruthy();
	});
});
