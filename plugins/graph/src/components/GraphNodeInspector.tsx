import { openInEditorAction } from "@next-devtools/host-next/open-in-editor-action";
import type { DependencySource } from "@next-devtools/runtime-react";
import { Badge, Button } from "@next-devtools/ui";
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
			<div
				style={{
					padding: 12,
					fontSize: 12,
					color: "var(--muted-foreground)",
				}}
			>
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
		<div
			style={{
				padding: 12,
				display: "flex",
				flexDirection: "column",
				gap: 8,
				fontSize: 12,
				overflow: "auto",
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
				<span style={{ fontWeight: 600, fontSize: 13 }}>{node.label}</span>
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

			<div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>
				{NODE_KIND_META[node.kind].description}
			</div>

			{node.note ? (
				<div
					style={{
						fontSize: 11,
						padding: 8,
						borderRadius: 6,
						background: "var(--muted, rgba(127,127,127,0.08))",
					}}
				>
					{node.note}
				</div>
			) : null}

			<dl
				style={{
					display: "grid",
					gridTemplateColumns: "110px 1fr",
					gap: 4,
					margin: 0,
				}}
			>
				<dt style={{ color: "var(--muted-foreground)" }}>Component id</dt>
				<dd
					style={{
						margin: 0,
						fontFamily: "var(--font-mono, monospace)",
						fontSize: 11,
					}}
				>
					{node.componentId}
				</dd>
				<dt style={{ color: "var(--muted-foreground)" }}>Depth</dt>
				<dd style={{ margin: 0 }}>{node.depth}</dd>
				{node.hookIndex !== undefined ? (
					<>
						<dt style={{ color: "var(--muted-foreground)" }}>Hook index</dt>
						<dd style={{ margin: 0 }}>{node.hookIndex}</dd>
					</>
				) : null}
				{node.valueLabel ? (
					<>
						<dt style={{ color: "var(--muted-foreground)" }}>Value</dt>
						<dd
							style={{
								margin: 0,
								fontFamily: "var(--font-mono, monospace)",
								fontSize: 11,
							}}
						>
							{node.valueLabel}
						</dd>
					</>
				) : null}
				{node.depsLabel ? (
					<>
						<dt style={{ color: "var(--muted-foreground)" }}>Dependencies</dt>
						<dd
							style={{
								margin: 0,
								fontFamily: "var(--font-mono, monospace)",
								fontSize: 11,
							}}
						>
							{node.depsLabel}
						</dd>
					</>
				) : null}
				{node.providerDisplayName ? (
					<>
						<dt style={{ color: "var(--muted-foreground)" }}>Provider</dt>
						<dd style={{ margin: 0 }}>{node.providerDisplayName}</dd>
					</>
				) : null}
				{sourceText ? (
					<>
						<dt style={{ color: "var(--muted-foreground)" }}>Source</dt>
						<dd
							style={{
								margin: 0,
								fontFamily: "var(--font-mono, monospace)",
								fontSize: 11,
							}}
						>
							{sourceText}
						</dd>
					</>
				) : null}
				<dt style={{ color: "var(--muted-foreground)" }}>Evidence source</dt>
				<dd style={{ margin: 0, fontSize: 11 }}>{node.evidenceSource}</dd>
			</dl>

			{source ? (
				<Button size="sm" variant="outline" onClick={openInEditor}>
					Open in editor
				</Button>
			) : (
				<div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
					No validated source location is available for this node.
				</div>
			)}
			{openStatus ? (
				<div
					style={{
						fontSize: 11,
						color: openStatus.ok
							? "var(--success, #16a34a)"
							: "var(--destructive, #dc2626)",
					}}
				>
					{openStatus.text}
				</div>
			) : null}

			{relatedEdges.length > 0 ? (
				<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<div style={{ fontWeight: 600, fontSize: 11 }}>Related edges</div>
					{relatedEdges.map((edge) => {
						const otherId = edge.source === node.id ? edge.target : edge.source;
						const other = nodeById(view, otherId);
						return (
							<button
								key={edge.id}
								type="button"
								onClick={() => onSelectNode(otherId)}
								style={{
									textAlign: "left",
									padding: "4px 6px",
									borderRadius: 4,
									border: "1px solid var(--border, rgba(127,127,127,0.25))",
									background: "transparent",
									color: "var(--foreground)",
									cursor: "pointer",
									fontSize: 11,
								}}
							>
								{EDGE_KIND_META[edge.kind].label} · {other?.label ?? otherId} ·{" "}
								{EVIDENCE_META[edge.evidence].label}
							</button>
						);
					})}
				</div>
			) : null}
		</div>
	);
}
