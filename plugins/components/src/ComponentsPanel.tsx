import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import {
  RUNTIME_SERVICE_IDS,
  type RuntimeServiceSnapshot,
} from "@next-devtools/contracts";
import {
  EmptyState,
  ElementHighlight,
  ElementPicker,
  SearchField,
  Select,
} from "@next-devtools/ui";
import { openInEditorAction } from "@next-devtools/host-next/open-in-editor-action";
import type { ResolvedElementSource } from "@next-devtools/source-inspector";
import type {
  ComponentDetail,
  ComponentNode,
  ReactRuntimeService,
  ReactRuntimeSnapshot,
} from "@next-devtools/runtime-react";
import {
  filterComponentRows,
  flattenComponentTree,
  formatInspectorValue,
  formatSourceLocation,
} from "./component-tree-data.js";

type EditorChoice = "vscode" | "cursor";
type LocatedSource = { file: string; line: number; column?: number };
const TREE_ROW_HEIGHT = 26;
const TREE_VIEWPORT_HEIGHT = 420;
const TREE_OVERSCAN_ROWS = 8;

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

const EDITOR_OPTIONS = [
  { value: "vscode", label: "VS Code" },
  { value: "cursor", label: "Cursor" },
];

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
  const [query, setQuery] = React.useState("");
  const [treeScrollTop, setTreeScrollTop] = React.useState(0);
  const [focusedTreeRow, setFocusedTreeRow] = React.useState<number | null>(
    null,
  );
  const treeContainerRef = React.useRef<HTMLDivElement | null>(null);
  const treeItemRefs = React.useRef(new Map<string, HTMLButtonElement>());
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

  const rows = React.useMemo(
    () => filterComponentRows(flattenComponentTree(snapshot.data.tree), query),
    [snapshot.data.tree, query],
  );
  const firstVisibleRow = Math.max(
    0,
    Math.floor(treeScrollTop / TREE_ROW_HEIGHT) - TREE_OVERSCAN_ROWS,
  );
  const lastVisibleRow = Math.min(
    rows.length,
    Math.ceil((treeScrollTop + TREE_VIEWPORT_HEIGHT) / TREE_ROW_HEIGHT) +
      TREE_OVERSCAN_ROWS,
  );
  const selectedRowIndex = selectedId
    ? rows.findIndex(({ node }) => node.id === selectedId)
    : -1;
  const rovingRowIndex =
    focusedTreeRow ?? (selectedRowIndex >= 0 ? selectedRowIndex : 0);
  const focusTreeRow = React.useCallback(
    (rowIndex: number) => {
      if (rows.length === 0) return;
      const nextIndex = Math.max(0, Math.min(rowIndex, rows.length - 1));
      const container = treeContainerRef.current;
      const top = nextIndex * TREE_ROW_HEIGHT;
      if (container) {
        if (top < container.scrollTop) container.scrollTop = top;
        else if (
          top + TREE_ROW_HEIGHT >
          container.scrollTop + container.clientHeight
        )
          container.scrollTop = top + TREE_ROW_HEIGHT - container.clientHeight;
      }
      setFocusedTreeRow(nextIndex);
      const id = rows[nextIndex]?.node.id;
      if (!id) return;
      requestAnimationFrame(() => treeItemRefs.current.get(id)?.focus());
    },
    [rows],
  );

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Components</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--muted, #71717a)",
              fontFamily: "monospace",
            }}
          >
            {snapshot.status}
          </span>
          <button
            type="button"
            onClick={() => setPicking((value) => !value)}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              border: "1px solid var(--border, #e4e4e7)",
              borderRadius: 4,
              background: picking ? "#2563eb" : "transparent",
              color: picking ? "#fff" : "inherit",
              cursor: "pointer",
            }}
          >
            {picking ? "Picking… (Esc to cancel)" : "Pick element"}
          </button>
        </div>
      </div>

      {pickedTag ? (
        <div style={{ fontSize: 11, color: "var(--muted, #71717a)" }}>
          Picked {pickedTag}
          {pickedSourceOrigin ? ` · source: ${pickedSourceOrigin}` : ""}
          {pickedSourceRole ? ` · ${pickedSourceRole}` : ""}
        </div>
      ) : null}

      <ElementPicker
        active={picking}
        onPick={handlePick}
        onCancel={cancelPick}
      />
      <ElementHighlight element={pickedElement} />

      {!bridgeAvailable ? (
        <EmptyState
          title="React component inspection is unavailable"
          description={unavailableReason}
        />
      ) : (
        <div
          aria-label="Suspense diagnostics"
          style={{
            fontSize: 11,
            color: "var(--muted, #71717a)",
            padding: "6px 8px",
            border: "1px solid var(--border, #e4e4e7)",
            borderRadius: 4,
          }}
        >
          Suspense boundaries: {snapshot.data.suspense?.length ?? 0}
          {snapshot.data.suspense?.length
            ? ` · ${snapshot.data.suspense
                .map(
                  (boundary) => `${boundary.displayName} (${boundary.status})`,
                )
                .join(", ")}`
            : ""}
        </div>
      )}

      {bridgeAvailable ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flex: 1,
            minHeight: 240,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              flex: "1 1 55%",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--border, #e4e4e7)",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: 8,
                borderBottom: "1px solid var(--border, #e4e4e7)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, flex: "0 0 auto" }}>
                Component Tree
              </div>
              <div style={{ flex: 1, minWidth: 90 }}>
                <SearchField
                  value={query}
                  onChange={setQuery}
                  placeholder="Filter components…"
                />
              </div>
              {roots.length > 1 ? (
                <div style={{ width: 96 }}>
                  <Select
                    value={activeRootId ?? ""}
                    onChange={setRootOverride}
                    options={roots.map((id, index) => ({
                      value: id,
                      label: `Root ${index + 1}`,
                    }))}
                    label="React root"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void service?.refreshRoots().then((next) => {
                    const root = next[0];
                    if (root) void service?.readTree(root);
                  });
                }}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  border: "1px solid var(--border, #e4e4e7)",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
            </div>
            <div
              ref={treeContainerRef}
              role="tree"
              aria-label="React component tree"
              style={{
                overflow: "auto",
                flex: 1,
                height: TREE_VIEWPORT_HEIGHT,
                maxHeight: TREE_VIEWPORT_HEIGHT,
                padding: "4px 0",
              }}
              onScroll={(event) =>
                setTreeScrollTop(event.currentTarget.scrollTop)
              }
            >
              {rows.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    fontSize: 12,
                    color: "var(--muted, #71717a)",
                    textAlign: "center",
                  }}
                >
                  {snapshot.data.tree.length === 0
                    ? "No components found in this React root yet."
                    : "No components match the filter."}
                </div>
              ) : (
                <div
                  style={{
                    position: "relative",
                    height: rows.length * TREE_ROW_HEIGHT,
                  }}
                >
                  {rows
                    .slice(firstVisibleRow, lastVisibleRow)
                    .map(({ node, depth }, visibleIndex) => {
                      const rowIndex = firstVisibleRow + visibleIndex;
                      const selected = node.id === selectedId;
                      return (
                        <button
                          key={node.id}
                          ref={(element) => {
                            if (element)
                              treeItemRefs.current.set(node.id, element);
                            else treeItemRefs.current.delete(node.id);
                          }}
                          type="button"
                          role="treeitem"
                          tabIndex={rowIndex === rovingRowIndex ? 0 : -1}
                          aria-selected={selected}
                          aria-level={depth + 1}
                          aria-setsize={rows.length}
                          aria-posinset={rowIndex + 1}
                          title={
                            formatSourceLocation(node.source) ??
                            node.displayName
                          }
                          onClick={() => void selectComponent(node.id)}
                          onFocus={() => setFocusedTreeRow(rowIndex)}
                          onKeyDown={(event) => {
                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              focusTreeRow(rowIndex + 1);
                            } else if (event.key === "ArrowUp") {
                              event.preventDefault();
                              focusTreeRow(rowIndex - 1);
                            } else if (event.key === "Home") {
                              event.preventDefault();
                              focusTreeRow(0);
                            } else if (event.key === "End") {
                              event.preventDefault();
                              focusTreeRow(rows.length - 1);
                            }
                          }}
                          style={{
                            position: "absolute",
                            top: rowIndex * TREE_ROW_HEIGHT,
                            left: 0,
                            right: 0,
                            height: TREE_ROW_HEIGHT,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            width: "100%",
                            textAlign: "left",
                            padding: `3px 8px 3px ${8 + depth * 14}px`,
                            border: "none",
                            borderLeft: selected
                              ? "2px solid #2563eb"
                              : "2px solid transparent",
                            background: selected
                              ? "rgba(37,99,235,0.12)"
                              : "transparent",
                            color: "inherit",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontFamily:
                                node.kind === "host" ? "monospace" : undefined,
                            }}
                          >
                            {node.displayName}
                          </span>
                          {node.hasState ? (
                            <span
                              aria-label="has state"
                              title="Has state"
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#2563eb",
                                flex: "0 0 auto",
                              }}
                            />
                          ) : null}
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10,
                              color: "var(--muted, #71717a)",
                              flex: "0 0 auto",
                            }}
                          >
                            {node.kind}
                          </span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          <div
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
              <div style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>
                Inspector
              </div>
              {sourceTarget ? (
                <>
                  <div style={{ width: 92 }}>
                    <Select
                      value={editor}
                      onChange={(value) =>
                        setEditor(value === "cursor" ? "cursor" : "vscode")
                      }
                      options={EDITOR_OPTIONS}
                      label="Editor"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void openSelected()}
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      border: "1px solid var(--border, #e4e4e7)",
                      borderRadius: 4,
                      background: "#2563eb",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Open
                  </button>
                </>
              ) : null}
            </div>
            <div style={{ overflow: "auto", flex: 1, maxHeight: 420 }}>
              {!selectedId && !selectedSource ? (
                <div
                  style={{
                    padding: 16,
                    fontSize: 12,
                    color: "var(--muted, #71717a)",
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
                          color: "var(--muted, #71717a)",
                        }}
                      >
                        {selectedNode.kind}
                      </span>
                    </div>
                  ) : null}

                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: "var(--muted, #71717a)" }}>
                      Source:{" "}
                    </span>
                    <span style={{ fontFamily: "monospace" }}>
                      {formatSourceLocation(sourceTarget) ??
                        "not recorded for this component"}
                    </span>
                  </div>

                  {openStatus ? (
                    <div
                      role="status"
                      style={{
                        fontSize: 11,
                        color: openStatus.ok ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {openStatus.text}
                    </div>
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
                    Object.keys(selectedDetail.props).length > 0
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
                      selectedDetail && selectedDetail.state !== null
                        ? 1
                        : undefined
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
        </div>
      ) : null}
    </div>
  );
}

function InspectorSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number | undefined;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--border, #e4e4e7)",
        borderRadius: 4,
        padding: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        <span>{title}</span>
        {typeof count === "number" ? (
          <span style={{ color: "var(--muted, #71717a)", fontWeight: 400 }}>
            {count}
          </span>
        ) : null}
      </div>
      <pre
        style={{
          margin: 0,
          fontSize: 11,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "monospace",
          color: "var(--muted-foreground, #3f3f46)",
        }}
      >
        {children}
      </pre>
    </section>
  );
}
