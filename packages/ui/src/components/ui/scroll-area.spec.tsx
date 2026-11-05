/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
	it("renders", () => {
		const { container } = render(<ScrollArea>content</ScrollArea>);
		expect(container.firstChild).toBeTruthy();
	});
});
