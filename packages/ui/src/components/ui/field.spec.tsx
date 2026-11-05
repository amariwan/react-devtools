/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";

describe("Field", () => {
	it("renders", () => {
		render(
			<Field>
				<FieldLabel>l</FieldLabel>
				<FieldDescription>d</FieldDescription>
				<FieldError>e</FieldError>
			</Field>,
		);
		expect(screen.getByText("l")).toBeTruthy();
	});
});
