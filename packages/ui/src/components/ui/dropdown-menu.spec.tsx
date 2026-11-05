/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
	it("renders trigger", () => {
		render(
			<DropdownMenu>
				<DropdownMenuTrigger>t</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>i</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
