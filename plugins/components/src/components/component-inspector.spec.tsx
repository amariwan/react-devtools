/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
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
				openStatus="available"
				editor="vscode"
				onEditorChange={() => undefined}
				onOpen={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
