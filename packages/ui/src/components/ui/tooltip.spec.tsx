/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./tooltip";

describe("Tooltip", () => {
	it("renders trigger", () => {
		render(
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>t</TooltipTrigger>
					<TooltipContent>c</TooltipContent>
				</Tooltip>
			</TooltipProvider>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
