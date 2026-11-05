/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./sheet";

describe("Sheet", () => {
	it("renders trigger", () => {
		render(
			<Sheet>
				<SheetTrigger>t</SheetTrigger>
				<SheetContent>
					<SheetTitle>x</SheetTitle>
				</SheetContent>
			</Sheet>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
