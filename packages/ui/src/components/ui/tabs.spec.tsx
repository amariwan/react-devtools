/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

describe("Tabs", () => {
	it("renders trigger", () => {
		render(
			<Tabs defaultValue="a">
				<TabsList>
					<TabsTrigger value="a">t</TabsTrigger>
				</TabsList>
				<TabsContent value="a">c</TabsContent>
			</Tabs>,
		);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
