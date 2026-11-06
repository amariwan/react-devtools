import { openInEditorAction } from "@next-devtools/host-next/open-in-editor-action";
import type { DependencySource } from "@next-devtools/runtime-react";
import { Badge, Button, ExternalLink, IconButton } from "@next-devtools/ui";
import * as React from "react";
import type { GraphView } from "../lib/graph-model.js";
import {
	EDGE_KIND_META,
	EVIDENCE_META,
	NODE_KIND_META,
} from "../lib/graph-model.js";
import { edgesForNode, nodeById } from "../lib/graph-transform.js";

export interface GraphNodeInspectorProps {
	readonly view: GraphView;
	readonly selectedNodeId: string | null;
	readonly selectedEdgeId?: string | null;
	readonly onSelectNode: (id: string) => void;
	readonly editor?: "cursor" | "vscode";
}

function formatSource(source: DependencySource | undefined): string | null {
	if (!source) return null;
	return `${source.file}:${source.line}:${source.column}`;
}

export function GraphNodeInspector({
	view,
	selectedNodeId,
	onSelectNode,
	editor = "cursor",
}: GraphNodeInspectorProps) {
	const node = React.useMemo(
		() => nodeById(view, selectedNodeId ?? undefined),
		[view, selectedNodeId],
	);
	const relatedEdges = React.useMemo(
		() => edgesForNode(view, selectedNodeId ?? undefined),
		[view, selectedNodeId],
	);
	const [openStatus, setOpenStatus] = React.useState<{
		ok: boolean;
		text: string;
	} | null>(null);

	if (!node) {
		return (
			<div className="devtools:p-3 devtools:text-xs devtools:text-muted-foreground">
				Select a node to inspect its verified reactive metadata.
			</div>
		);
	}

	const source = node.source;
	const sourceText = formatSource(source);

	const openInEditor = async () => {
		if (!source) return;
		setOpenStatus({ ok: true, text: "Opening…" });
		const result = await openInEditorAction({
			path: source.file,
			line: source.line,
			column: source.column ?? 1,
			editor,
		});
		setOpenStatus(
			result.ok
				? {
						ok: true,
						text: `Opened in ${editor === "cursor" ? "Cursor" : "VS Code"}`,
					}
				: { ok: false, text: `Failed: ${result.reason}` },
		);
	};

	return (
		<div className="devtools:flex devtools:flex-col devtools:gap-2 devtools:overflow-auto devtools:p-3 devtools:text-xs">
			<div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-1.5">
				<span className="devtools:break-all devtools:text-sm devtools:font-semibold">
					{node.label}
				</span>
				<Badge variant="secondary">{NODE_KIND_META[node.kind].label}</Badge>
				<Badge
					variant={
						node.evidence === "observed"
							? "default"
							: node.evidence === "partial"
								? "outline"
								: "destructive"
					}
				>
					{EVIDENCE_META[node.evidence].label}
				</Badge>
			</div>

			<div className="devtools:text-[11px] devtools:text-muted-foreground">
				{NODE_KIND_META[node.kind].description}
			</div>

			{node.note ? (
				<div className="devtools:rounded-md devtools:bg-muted devtools:p-2 devtools:text-[11px] devtools:leading-relaxed">
					{node.note}
				</div>
			) : null}

			<dl className="devtools:m-0 devtools:grid devtools:grid-cols-[110px_minmax(0,1fr)] devtools:gap-x-2 devtools:gap-y-1">
				<dt className="devtools:text-muted-foreground">Component id</dt>
				<dd className="devtools:m-0 devtools:break-all devtools:font-mono devtools:text-[11px]">
					{node.componentId}
				</dd>
				<dt className="devtools:text-muted-foreground">Depth</dt>
				<dd className="devtools:m-0 devtools:tabular-nums">{node.depth}</dd>
				{node.hookIndex !== undefined ? (
					<>
						<dt className="devtools:text-muted-foreground">Hook index</dt>
						<dd className="devtools:m-0 devtools:tabular-nums">
							{node.hookIndex}
						</dd>
					</>
				) : null}
				{node.valueLabel ? (
					<>
						<dt className="devtools:text-muted-foreground">Value</dt>
						<dd className="devtools:m-0 devtools:break-all devtools:font-mono devtools:text-[11px]">
							{node.valueLabel}
						</dd>
					</>
				) : null}
				{node.depsLabel ? (
					<>
						<dt className="devtools:text-muted-foreground">Dependencies</dt>
						<dd className="devtools:m-0 devtools:break-all devtools:font-mono devtools:text-[11px]">
							{node.depsLabel}
						</dd>
					</>
				) : null}
				{node.providerDisplayName ? (
					<>
						<dt className="devtools:text-muted-foreground">Provider</dt>
						<dd className="devtools:m-0 devtools:break-all">
							{node.providerDisplayName}
						</dd>
					</>
				) : null}
				{sourceText ? (
					<>
						<dt className="devtools:text-muted-foreground">Source</dt>
						<dd className="devtools:m-0 devtools:break-all devtools:font-mono devtools:text-[11px]">
							{sourceText}
						</dd>
					</>
				) : null}
				<dt className="devtools:text-muted-foreground">Evidence source</dt>
				<dd className="devtools:m-0 devtools:break-words devtools:text-[11px]">
					{node.evidenceSource}
				</dd>
			</dl>

			{source ? (
				<IconButton
					icon={ExternalLink}
					label="Open source in editor"
					variant="outline"
					onClick={openInEditor}
				/>
			) : (
				<div className="devtools:text-[11px] devtools:text-muted-foreground">
					No validated source location is available for this node.
				</div>
			)}
			{openStatus ? (
				<div
					className={`devtools:text-[11px] ${openStatus.ok ? "devtools:text-success" : "devtools:text-destructive"}`}
				>
					{openStatus.text}
				</div>
			) : null}

			{relatedEdges.length > 0 ? (
				<div className="devtools:flex devtools:flex-col devtools:gap-1">
					<div className="devtools:text-[11px] devtools:font-semibold">
						Related edges
					</div>
					{relatedEdges.map((edge) => {
						const otherId = edge.source === node.id ? edge.target : edge.source;
						const other = nodeById(view, otherId);
						return (
							<Button
								key={edge.id}
								onClick={() => onSelectNode(otherId)}
								variant="outline"
								size="xs"
								className="devtools:h-auto devtools:min-h-7 devtools:justify-start devtools:whitespace-normal devtools:text-left devtools:font-normal"
							>
								{EDGE_KIND_META[edge.kind].label} · {other?.label ?? otherId} ·{" "}
								{EVIDENCE_META[edge.evidence].label}
							</Button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}
