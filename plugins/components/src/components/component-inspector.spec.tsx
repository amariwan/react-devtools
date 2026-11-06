/**
 * @vitest-environment jsdom
 */
import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentInspector } from "./component-inspector";

describe("ComponentInspector", () => {
	it("renders", () => {
		const { container } = render(
			<ComponentInspector
				selectedId={null}
				selectedSource={null}
				selectedNode={null}
				selectedDetail={null}
				sourceTarget={null}
				openStatus={null}
				editor="vscode"
				onEditorChange={() => undefined}
				onOpen={async () => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});

	it("renders nested props as expandable values with copy actions", async () => {
		render(
			<ComponentInspector
				selectedId="component-1"
				selectedSource={null}
				selectedNode={undefined}
				selectedDetail={{
					id: "component-1",
					props: { config: { enabled: true } },
					hooks: [],
					state: null,
					context: [],
				}}
				sourceTarget={null}
				openStatus={null}
				editor="vscode"
				onEditorChange={() => undefined}
				onOpen={async () => undefined}
			/>,
		);

		expect(
			screen.getByRole("region", { name: "Component inspector" }),
		).toBeTruthy();
		const propsSection = screen.getByRole("region", { name: "Props" });
		fireEvent.click(within(propsSection).getAllByText("{1}")[1]!);
		await waitFor(() => expect(screen.getByText("true")).toBeTruthy());
		expect(
			screen.getByRole("button", {
				name: "Copy JSON at props.config.enabled",
			}),
		).toBeTruthy();
	});
});
