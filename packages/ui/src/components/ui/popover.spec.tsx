/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

describe("Popover", () => {
	it("renders trigger", () => {
		render(
			<Popover>
				<PopoverTrigger>t</PopoverTrigger>
				<PopoverContent>c</PopoverContent>
			</Popover>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
