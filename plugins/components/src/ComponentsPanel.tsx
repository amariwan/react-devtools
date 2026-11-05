import {
	RUNTIME_SERVICE_IDS,
	type RuntimeServiceSnapshot,
} from "@next-devtools/contracts";
import type { PluginRegistry } from "@next-devtools/core";
import { openInEditorAction } from "@next-devtools/host-next/open-in-editor-action";
import type {
	ComponentDetail,
	ComponentNode,
	ReactRuntimeService,
	ReactRuntimeSnapshot,
} from "@next-devtools/runtime-react";
import type { ResolvedElementSource } from "@next-devtools/source-inspector";
import {
	Button,
	ElementHighlight,
	ElementPicker,
	PanelHeader,
	StatusDot,
} from "@next-devtools/ui";
import * as React from "react";
import {
	ComponentInspector,
	type EditorChoice,
	type LocatedSource,
} from "./components/component-inspector.js";
import { ComponentRuntimeStatus } from "./components/component-runtime-status.js";
import { ComponentTree } from "./components/component-tree.js";
import { PickedElementStatus } from "./components/picked-element-status.js";

const UNAVAILABLE_SNAPSHOT: RuntimeServiceSnapshot<ReactRuntimeSnapshot> = {
	status: "unavailable",
	data: {
		capabilities: {
			tree: false,
			props: false,
			hooks: false,
			source: false,
			profiler: false,
			selection: false,
		},
		roots: [],
		tree: [],
	},
	reason: "React runtime service is not registered",
	revision: -1,
};

export default function ComponentsPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const service = registry.services.get<ReactRuntimeService>(
		RUNTIME_SERVICE_IDS.react,
	);
	const subscribe = React.useMemo(
		() =>
			(listener: () => void): (() => void) =>
				service?.subscribe(listener) ?? (() => undefined),
		[service],
	);
	const getSnapshot = React.useMemo(
		() => () => service?.getSnapshot() ?? UNAVAILABLE_SNAPSHOT,
		[service],
	);
	const snapshot = React.useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot,
	);

	const [picking, setPicking] = React.useState(false);
	const [mobileView, setMobileView] = React.useState<"tree" | "inspector">(
		"tree",
	);
	const [pickedElement, setPickedElement] = React.useState<HTMLElement | null>(
		null,
	);
	const [pickedTag, setPickedTag] = React.useState<string | null>(null);
	const [pickedSourceOrigin, setPickedSourceOrigin] = React.useState<
		string | null
	>(null);
	const [pickedSourceRole, setPickedSourceRole] = React.useState<string | null>(
		null,
	);
	const [rootOverride, setRootOverride] = React.useState<string | null>(null);
	const [selectedId, setSelectedId] = React.useState<string | null>(
		() => snapshot.data.selectedComponentId ?? null,
	);
	const [selectedDetail, setSelectedDetail] =
		React.useState<ComponentDetail | null>(() => snapshot.data.detail ?? null);
	const [selectedSource, setSelectedSource] =
		React.useState<LocatedSource | null>(() => snapshot.data.source ?? null);
	const [editor, setEditor] = React.useState<EditorChoice>("vscode");
	const [openStatus, setOpenStatus] = React.useState<{
		ok: boolean;
		text: string;
	} | null>(null);
	const selectionToken = React.useRef(0);
	const hydratedSelection = React.useRef<string | null>(null);

	// Ask the adapter for its roots as soon as the panel appears.
	React.useEffect(() => {
		if (!service) return;
		void service.refreshRoots();
	}, [service]);

	const roots = snapshot.data.roots;
	const activeRootId =
		(rootOverride && roots.includes(rootOverride) ? rootOverride : roots[0]) ??
		null;

	// Read the tree for the active root, and again whenever the root changes.
	React.useEffect(() => {
		if (!service || !activeRootId) return;
		void service.readTree(activeRootId);
		void service.readSuspenseBoundaries(activeRootId);
	}, [service, activeRootId]);

	// A React commit can update Fiber data without producing a DOM mutation.
	// Use the dedicated commit channel without notifying capabilities.
	React.useEffect(() => {
		if (!service || !activeRootId) return;
		return service.subscribeToCommits((event) => {
			// The DevTools shell is itself a React root. Refresh only for the
			// inspected root, otherwise rendering this panel would trigger itself.
			if (event.rootId && event.rootId !== activeRootId) return;
			void service.readTree(activeRootId);
			void service.readSuspenseBoundaries(activeRootId);
		});
	}, [service, activeRootId]);

	const selectComponent = React.useCallback(
		async (id: string) => {
			setMobileView("inspector");
			setSelectedId(id);
			setSelectedDetail(null);
			setSelectedSource(null);
			setOpenStatus(null);
			setPickedTag(null);
			hydratedSelection.current = id;
			const token = ++selectionToken.current;
			if (!service) return;
			service.selectComponent(id);
			const [detail, source] = await Promise.all([
				service.readDetail(id),
				service.readSource(id),
			]);
			if (selectionToken.current !== token) return;
			setSelectedDetail(detail ?? null);
			setSelectedSource(source ?? null);
		},
		[service],
	);

	React.useEffect(() => {
		if (!service || !selectedId || hydratedSelection.current === selectedId)
			return;
		hydratedSelection.current = selectedId;
		if (selectedDetail || selectedSource) return;
		void selectComponent(selectedId);
	}, [service, selectedDetail, selectedId, selectedSource, selectComponent]);

	const handlePick = React.useCallback(
		async (element: HTMLElement, source: ResolvedElementSource | null) => {
			setPicking(false);
			setMobileView("inspector");
			setPickedElement(element);
			setPickedTag(`<${element.tagName.toLowerCase()}>`);
			setPickedSourceOrigin(source?.origin ?? null);
			setPickedSourceRole(source?.role ?? null);
			const id = await service?.selectByDomNode(element);
			if (id) {
				await selectComponent(id);
				return;
			}
			// The fiber bridge could not map this element (for example an element
			// rendered outside React) — fall back to the resolved debug source.
			if (source?.filePath && source.lineNumber) {
				selectionToken.current++;
				setSelectedId(null);
				setSelectedDetail(null);
				setSelectedSource({
					file: source.filePath,
					line: source.lineNumber,
					...(source.columnNumber ? { column: source.columnNumber } : {}),
				});
				setOpenStatus(null);
				return;
			}
			setOpenStatus({
				ok: false,
				text: "Source location unavailable for this element.",
			});
		},
		[service, selectComponent],
	);

	const cancelPick = React.useCallback(() => setPicking(false), []);

	const selectedNode: ComponentNode | undefined = React.useMemo(
		() =>
			selectedId
				? snapshot.data.tree.find((node) => node.id === selectedId)
				: undefined,
		[snapshot.data.tree, selectedId],
	);

	const sourceTarget: LocatedSource | null = React.useMemo(() => {
		if (selectedSource) return selectedSource;
		if (selectedNode?.source) {
			return {
				file: selectedNode.source.file,
				line: selectedNode.source.line,
				column: selectedNode.source.column,
			};
		}
		return null;
	}, [selectedSource, selectedNode]);

	const openSelected = React.useCallback(async () => {
		if (!sourceTarget) return;
		setOpenStatus({ ok: true, text: "Opening…" });
		const result = await openInEditorAction({
			path: sourceTarget.file,
			line: sourceTarget.line,
			column: sourceTarget.column ?? 1,
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
	}, [sourceTarget, editor]);

	const bridgeAvailable =
		snapshot.status === "available" || snapshot.status === "partial";
	const cap = registry.capabilities.require("react.component.inspect");
	const unavailableReason =
		snapshot.reason ?? cap?.reason ?? "React bridge is not connected.";

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
			<PanelHeader
				title="Components"
				actions={
					<>
						<StatusDot status={snapshot.status} />
						<Button
							type="button"
							aria-pressed={picking}
							onClick={() => setPicking((value) => !value)}
						>
							{picking ? "Picking… (Esc to cancel)" : "Pick element"}
						</Button>
					</>
				}
			/>

			<PickedElementStatus
				tag={pickedTag}
				sourceOrigin={pickedSourceOrigin}
				sourceRole={pickedSourceRole}
			/>

			<ElementPicker
				active={picking}
				onPick={handlePick}
				onCancel={cancelPick}
			/>
			<ElementHighlight element={pickedElement} />

			<ComponentRuntimeStatus
				available={bridgeAvailable}
				unavailableReason={unavailableReason}
				suspense={snapshot.data.suspense}
			/>

			{bridgeAvailable ? (
				<fieldset className="devtools-component-view-switch">
					<legend className="devtools:sr-only">Components view</legend>
					<Button
						type="button"
						size="sm"
						variant={mobileView === "tree" ? "default" : "outline"}
						aria-pressed={mobileView === "tree"}
						onClick={() => setMobileView("tree")}
					>
						Tree
					</Button>
					<Button
						type="button"
						size="sm"
						variant={mobileView === "inspector" ? "default" : "outline"}
						aria-pressed={mobileView === "inspector"}
						onClick={() => setMobileView("inspector")}
					>
						Inspector
					</Button>
				</fieldset>
			) : null}

			{bridgeAvailable ? (
				<div
					className="devtools-inspector-split"
					data-mobile-view={mobileView}
					style={{
						flex: 1,
						minHeight: 240,
						alignItems: "stretch",
					}}
				>
					<ComponentTree
						key={activeRootId ?? "no-root"}
						tree={snapshot.data.tree}
						roots={roots}
						activeRootId={activeRootId}
						selectedId={selectedId}
						onRootChange={setRootOverride}
						onSelect={selectComponent}
						onRefresh={async () => {
							const next = await service?.refreshRoots();
							const root = next?.[0];
							if (root) await service?.readTree(root);
						}}
					/>
					<ComponentInspector
						selectedId={selectedId}
						selectedSource={selectedSource}
						selectedNode={selectedNode}
						selectedDetail={selectedDetail}
						sourceTarget={sourceTarget}
						openStatus={openStatus}
						editor={editor}
						onEditorChange={setEditor}
						onOpen={openSelected}
					/>
				</div>
			) : null}
		</div>
	);
}
