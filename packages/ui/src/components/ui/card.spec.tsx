/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardTitle } from "./card";

describe("Card", () => {
	it("renders", () => {
		render(
			<Card>
				<CardTitle>title</CardTitle>
			</Card>,
		);
		expect(screen.getByText("title")).toBeTruthy();
	});
});
