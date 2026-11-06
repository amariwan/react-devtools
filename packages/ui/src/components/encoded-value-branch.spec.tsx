/**
 * @vitest-environment jsdom
 */
import { encodeValue } from "@next-devtools/contracts";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EncodedValueBranch } from "./encoded-value-branch";

describe("EncodedValueBranch", () => {
	it("shows nested values by type and exposes copy actions", () => {
		const onCopy = vi.fn();
		render(
			<EncodedValueBranch
				value={encodeValue({ title: "Dashboard", count: 3, enabled: true })}
				path="props"
				onCopy={onCopy}
			/>,
		);

		expect(screen.getByText('"Dashboard"').className).toContain(
			"devtools:text-success",
		);
		expect(screen.getByText("3").className).toContain("devtools:text-primary");
		expect(screen.getByText("true").className).toContain(
			"devtools:text-warning",
		);
		const copyButton = screen.getByRole("button", {
			name: "Copy JSON at props.title",
		});
		fireEvent.click(copyButton);
		expect(onCopy).toHaveBeenCalledWith(
			encodeValue("Dashboard"),
			"props.title",
		);
	});
});
