/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./collapsible";

describe("Collapsible", () => {
	it("renders trigger", () => {
		render(
			<Collapsible>
				<CollapsibleTrigger>toggle</CollapsibleTrigger>
				<CollapsibleContent>content</CollapsibleContent>
			</Collapsible>,
		);
		expect(screen.getByText("toggle")).toBeTruthy();
	});
});
