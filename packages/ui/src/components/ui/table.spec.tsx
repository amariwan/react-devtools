/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";

describe("Table", () => {
	it("renders", () => {
		render(
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>h</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					<TableRow>
						<TableCell>c</TableCell>
					</TableRow>
				</TableBody>
			</Table>,
		);
		expect(screen.getByText("h")).toBeTruthy();
		expect(screen.getByText("c")).toBeTruthy();
	});
});
