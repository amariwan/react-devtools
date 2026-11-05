/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

describe("HoverCard", () => {
	it("renders trigger", () => {
		render(
			<HoverCard>
				<HoverCardTrigger>t</HoverCardTrigger>
				<HoverCardContent>c</HoverCardContent>
			</HoverCard>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
