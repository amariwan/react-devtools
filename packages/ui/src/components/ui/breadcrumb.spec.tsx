/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "./breadcrumb";

describe("Breadcrumb", () => {
	it("renders", () => {
		render(
			<Breadcrumb>
				<BreadcrumbItem>
					<BreadcrumbLink href="/">home</BreadcrumbLink>
				</BreadcrumbItem>
			</Breadcrumb>,
		);
		expect(screen.getByText("home")).toBeTruthy();
	});
});
