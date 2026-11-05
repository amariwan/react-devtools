/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "./accordion";

describe("Accordion", () => {
	it("renders trigger", () => {
		render(
			<Accordion>
				<AccordionItem value="a">
					<AccordionTrigger>t</AccordionTrigger>
					<AccordionContent>c</AccordionContent>
				</AccordionItem>
			</Accordion>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
