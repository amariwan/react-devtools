import { type EncodedValue, encodeValue } from "@next-devtools/contracts";
import type {
	ComponentDetail,
	ComponentNode,
} from "@next-devtools/runtime-react";
import {
	EncodedValueBranch,
	ExternalLink,
	IconButton,
	Select,
	Toolbar,
} from "@next-devtools/ui";
import * as React from "react";
import { formatSourceLocation } from "../component-tree-data.js";
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
	const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
	React.useEffect(() => setCopyStatus(null), [selectedId, selectedSource]);
	const encodedValues = React.useMemo(() => {
		return {
			props: encodeValue(selectedDetail?.props ?? {}),
			hooks: encodeValue(selectedDetail?.hooks ?? []),
			state: encodeValue(selectedDetail?.state),
			context: encodeValue(selectedDetail?.context ?? []),
		};
	}, [selectedDetail]);
	const copyValue = async (value: EncodedValue, path: string) => {
		try {
			const json = JSON.stringify(value, null, 2);
			if (json === undefined || !navigator.clipboard?.writeText) {
				throw new Error("Clipboard access is unavailable.");
			}
			await navigator.clipboard.writeText(json);
			setCopyStatus(`Copied JSON at ${path}.`);
		} catch {
			setCopyStatus("Could not copy value. Check clipboard permissions.");
		}
	};
	return (
		<div
			role="region"
			aria-label="Component inspector"
			className="devtools-component-inspector devtools:flex devtools:min-w-0 devtools:flex-[1_1_45%] devtools:flex-col devtools:overflow-hidden devtools:rounded-md devtools:border devtools:border-border devtools:@max-[760px]/devtools:group-data-[mobile-view=tree]:hidden"
		>
			<Toolbar className="devtools:flex-nowrap devtools:gap-1.5 devtools:p-2">
				<h2 className="devtools:m-0 devtools:flex-1 devtools:text-xs devtools:font-semibold">
					Inspector
				</h2>
				{sourceTarget ? (
					<>
						<div className="devtools:w-[92px]">
							<Select
								value={editor}
								onChange={(value) =>
									onEditorChange(value === "cursor" ? "cursor" : "vscode")
								}
								options={EDITOR_OPTIONS}
								label="Editor"
							/>
						</div>
						<IconButton
							type="button"
							icon={ExternalLink}
							label="Open source in editor"
							onClick={() => void onOpen()}
						/>
					</>
				) : null}
			</Toolbar>
			<div className="devtools:min-h-0 devtools:max-h-[420px] devtools:flex-1 devtools:overflow-auto">
				{!selectedId && !selectedSource ? (
					<div className="devtools:p-4 devtools:text-center devtools:text-xs devtools:text-muted-foreground">
						Select a component or pick an element to inspect props, hooks,
						state, and source.
					</div>
				) : (
					<div className="devtools:grid devtools:gap-2.5 devtools:p-2">
						{selectedNode ? (
							<div className="devtools:flex devtools:flex-wrap devtools:items-baseline devtools:gap-1.5">
								<strong className="devtools:text-sm devtools:font-semibold">
									{selectedNode.displayName}
								</strong>
								<span className="devtools:text-[10px] devtools:text-muted-foreground">
									{selectedNode.kind}
								</span>
							</div>
						) : null}

						<div className="devtools:text-[11px]">
							<span className="devtools:text-muted-foreground">Source: </span>
							<span className="devtools:break-all devtools:font-mono">
								{formatSourceLocation(sourceTarget) ?? "Not recorded"}
							</span>
						</div>
						{!sourceTarget ? (
							<p className="devtools:text-xs devtools:text-muted-foreground">
								Use Pick element to resolve the source location.
							</p>
						) : null}

						{openStatus ? (
							<output
								className={`devtools:text-[11px] ${openStatus.ok ? "devtools:text-foreground" : "devtools:text-destructive"}`}
							>
								{openStatus.text}
							</output>
						) : null}
						{copyStatus ? (
							<output
								aria-live="polite"
								className="devtools:col-span-full devtools:text-[11px] devtools:text-muted-foreground"
							>
								{copyStatus}
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
							{selectedDetail &&
							Object.keys(selectedDetail.props).length > 0 ? (
								<EncodedValueBranch
									value={encodedValues.props}
									path="props"
									onCopy={copyValue}
								/>
							) : (
								"No props recorded."
							)}
						</InspectorSection>

						<InspectorSection
							title="Hooks"
							count={selectedDetail?.hooks.length}
						>
							{selectedDetail && selectedDetail.hooks.length > 0 ? (
								<EncodedValueBranch
									value={encodedValues.hooks}
									path="hooks"
									onCopy={copyValue}
								/>
							) : (
								"No hooks recorded."
							)}
						</InspectorSection>

						<InspectorSection
							title="State"
							count={
								selectedDetail && selectedDetail.state !== null ? 1 : undefined
							}
						>
							{selectedDetail && selectedDetail.state !== null ? (
								<EncodedValueBranch
									value={encodedValues.state}
									path="state"
									onCopy={copyValue}
								/>
							) : (
								"No component state."
							)}
						</InspectorSection>

						<InspectorSection
							title="Context"
							count={selectedDetail?.context.length}
						>
							{selectedDetail && selectedDetail.context.length > 0 ? (
								<EncodedValueBranch
									value={encodedValues.context}
									path="context"
									onCopy={copyValue}
								/>
							) : (
								"No context dependencies recorded."
							)}
						</InspectorSection>
					</div>
				)}
			</div>
		</div>
	);
}
