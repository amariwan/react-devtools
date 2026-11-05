/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";

describe("Dialog", () => {
	it("renders trigger", () => {
		render(
			<Dialog>
				<DialogTrigger>open</DialogTrigger>
				<DialogContent>
					<DialogTitle>t</DialogTitle>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByText("open")).toBeTruthy();
	});
});
