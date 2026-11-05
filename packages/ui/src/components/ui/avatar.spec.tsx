/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AvatarFallback } from "./avatar";

describe("Avatar", () => {
	it("renders", () => {
		render(
			<Avatar>
				<AvatarFallback>AB</AvatarFallback>
			</Avatar>,
		);
		expect(screen.getByText("AB")).toBeTruthy();
	});
});
