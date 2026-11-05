/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./alert-dialog";

describe("AlertDialog", () => {
	it("renders trigger", () => {
		render(
			<AlertDialog>
				<AlertDialogTrigger>open</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogTitle>t</AlertDialogTitle>
					<AlertDialogDescription>d</AlertDialogDescription>
				</AlertDialogContent>
			</AlertDialog>,
		);
		expect(screen.getByText("open")).toBeTruthy();
	});
});
