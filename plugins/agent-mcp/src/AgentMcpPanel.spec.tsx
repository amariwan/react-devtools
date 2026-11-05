/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AgentMcpPanel from "./AgentMcpPanel";

describe("AgentMcpPanel", () => {
	it("renders", () => {
		const registry = {
			capabilities: { onChange: () => () => undefined, list: () => [] },
			services: { get: () => undefined, subscribe: () => () => undefined },
			list: () => [],
			panels: { list: () => [] },
			commands: { list: () => [] },
			events: { on: () => () => undefined, emit: () => undefined },
		} as never;
		const { container } = render(<AgentMcpPanel registry={registry} />);
		expect(container).toBeTruthy();
	});
});
