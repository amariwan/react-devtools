/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
	it("renders", () => {
		render(
			<Alert>
				<AlertTitle>t</AlertTitle>
				<AlertDescription>d</AlertDescription>
			</Alert>,
		);
		expect(screen.getByText("t")).toBeTruthy();
		expect(screen.getByText("d")).toBeTruthy();
	});
});
