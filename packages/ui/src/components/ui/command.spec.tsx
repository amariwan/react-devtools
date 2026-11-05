/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Command, CommandInput, CommandItem, CommandList } from "./command";

describe("Command", () => {
	it("renders input", () => {
		render(<Command>command</Command>);
		expect(screen.getByText("command")).toBeTruthy();
	});
});
