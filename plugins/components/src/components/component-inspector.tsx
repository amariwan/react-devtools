import type {
	ComponentDetail,
	ComponentNode,
} from "@next-devtools/runtime-react";
import { Button, Select } from "@next-devtools/ui";
import {
	formatInspectorValue,
	formatSourceLocation,
} from "../component-tree-data.js";
import { InspectorSection } from "./inspector-section.js";

export type EditorChoice = "vscode" | "cursor";
export type LocatedSource = { file: string; line: number; column?: number };

const EDITOR_OPTIONS = [
	{ value: "vscode", label: "VS Code" },
	{ value: "cursor", label: "Cursor" },
];

type ComponentInspectorProps = {
	selectedId: string | null;
	selectedSource: LocatedSource | null;
	selectedNode: ComponentNode | undefined;
	selectedDetail: ComponentDetail | null;
	sourceTarget: LocatedSource | null;
	openStatus: { ok: boolean; text: string } | null;
	editor: EditorChoice;
	onEditorChange: (editor: EditorChoice) => void;
	onOpen: () => Promise<void>;
};

export function ComponentInspector({
	selectedId,
	selectedSource,
	selectedNode,
	selectedDetail,
	sourceTarget,
	openStatus,
	editor,
	onEditorChange,
	onOpen,
}: ComponentInspectorProps) {
	return (
		<div
			className="devtools-component-inspector"
			style={{
				flex: "1 1 45%",
				minWidth: 0,
				display: "flex",
				flexDirection: "column",
				border: "1px solid var(--border, #e4e4e7)",
				borderRadius: 6,
			}}
		>
			<div
				style={{
					padding: 8,
					borderBottom: "1px solid var(--border, #e4e4e7)",
					display: "flex",
					alignItems: "center",
					gap: 6,
				}}
			>
				<div style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Inspector</div>
				{sourceTarget ? (
					<>
						<div style={{ width: 92 }}>
							<Select
								value={editor}
								onChange={(value) =>
									onEditorChange(value === "cursor" ? "cursor" : "vscode")
								}
								options={EDITOR_OPTIONS}
								label="Editor"
							/>
						</div>
						<Button type="button" size="sm" onClick={() => void onOpen()}>
							Open
						</Button>
					</>
				) : null}
			</div>
			<div style={{ overflow: "auto", flex: 1, maxHeight: 420 }}>
				{!selectedId && !selectedSource ? (
					<div
						style={{
							padding: 16,
							fontSize: 12,
							color: "var(--muted-foreground, #71717a)",
							textAlign: "center",
						}}
					>
						Select a component or pick an element to inspect props, hooks,
						state, and source.
					</div>
				) : (
					<div style={{ padding: 8, display: "grid", gap: 10 }}>
						{selectedNode ? (
							<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
								<strong style={{ fontSize: 13 }}>
									{selectedNode.displayName}
								</strong>
								<span
									style={{
										fontSize: 10,
										color: "var(--muted-foreground, #71717a)",
									}}
								>
									{selectedNode.kind}
								</span>
							</div>
						) : null}

						<div style={{ fontSize: 11 }}>
							<span style={{ color: "var(--muted-foreground, #71717a)" }}>
								Source:{" "}
							</span>
							<span
								style={{
									fontFamily: "monospace",
									overflowWrap: "anywhere",
								}}
							>
								{formatSourceLocation(sourceTarget) ?? "Not recorded"}
							</span>
						</div>
						{!sourceTarget ? (
							<p
								style={{
									fontSize: 12,
									color: "var(--muted-foreground, #71717a)",
								}}
							>
								React did not record a source location. Try Pick element on the
								page to resolve one.
							</p>
						) : null}
						{selectedNode && selectedNode.displayName.length <= 2 ? (
							<p
								style={{
									fontSize: 12,
									color: "var(--muted-foreground, #71717a)",
								}}
							>
								Short component names may come from compiled code. Pick a
								visible element to locate it.
							</p>
						) : null}

						{openStatus ? (
							<output
								style={{
									fontSize: 11,
									color: openStatus.ok
										? "var(--foreground)"
										: "var(--destructive)",
								}}
							>
								{openStatus.text}
							</output>
						) : null}

						<InspectorSection
							title="Props"
							count={
								selectedDetail
									? Object.keys(selectedDetail.props).length
									: undefined
							}
						>
							{selectedDetail && Object.keys(selectedDetail.props).length > 0
								? formatInspectorValue(selectedDetail.props)
								: "No props recorded."}
						</InspectorSection>

						<InspectorSection
							title="Hooks"
							count={selectedDetail?.hooks.length}
						>
							{selectedDetail && selectedDetail.hooks.length > 0
								? selectedDetail.hooks
										.map(
											(hook) =>
												`${hook.name}\n${formatInspectorValue(hook.value)}`,
										)
										.join("\n\n")
								: "No hooks recorded."}
						</InspectorSection>

						<InspectorSection
							title="State"
							count={
								selectedDetail && selectedDetail.state !== null ? 1 : undefined
							}
						>
							{selectedDetail && selectedDetail.state !== null
								? formatInspectorValue(selectedDetail.state)
								: "No component state."}
						</InspectorSection>

						<InspectorSection
							title="Context"
							count={selectedDetail?.context.length}
						>
							{selectedDetail && selectedDetail.context.length > 0
								? formatInspectorValue(selectedDetail.context)
								: "No context dependencies recorded."}
						</InspectorSection>
					</div>
				)}
			</div>
		</div>
	);
}
