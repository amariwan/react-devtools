import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";
import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { ReactRuntimeService } from "@next-devtools/runtime-react";
import {
  Badge,
  Button,
  EmptyState,
  PanelHeader,
  SearchField,
  Toolbar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@next-devtools/ui";
import { buildGraphData } from "./graph-data.js";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import coseBilkent from "cytoscape-cose-bilkent";

let extensionsRegistered = false;
function registerExtensions(): void {
  if (extensionsRegistered) return;
  try {
    cytoscape.use(fcose);
  } catch {
    /* ignore duplicate registration */
  }
  try {
    cytoscape.use(coseBilkent);
  } catch {
    /* ignore duplicate registration */
  }
  extensionsRegistered = true;
}

type LayoutName =
  | "fcose"
  | "cose"
  | "cose-bilkent"
  | "grid"
  | "circle"
  | "concentric"
  | "breadthfirst";

const LAYOUT_OPTIONS: readonly { value: LayoutName; label: string }[] = [
  { value: "fcose", label: "fcose (force-directed)" },
  { value: "cose", label: "cose (force-directed)" },
  { value: "cose-bilkent", label: "cose-bilkent (force-directed)" },
  { value: "grid", label: "grid (discrete)" },
  { value: "circle", label: "circle (discrete)" },
  { value: "concentric", label: "concentric (discrete)" },
  { value: "breadthfirst", label: "breadthfirst (hierarchical)" },
];

function layoutOptionsFor(name: LayoutName, animate: boolean): cytoscape.LayoutOptions {
  const base = {
    animate,
    animationDuration: 450,
    fit: true,
    padding: 30,
  } as const;
  switch (name) {
    case "fcose":
      return { name: "fcose", ...base, quality: "default" } as cytoscape.LayoutOptions;
    case "cose":
      return { name: "cose", ...base } as cytoscape.LayoutOptions;
    case "cose-bilkent":
      return { name: "cose-bilkent", ...base } as cytoscape.LayoutOptions;
    case "circle":
      return { name: "circle", ...base } as cytoscape.LayoutOptions;
    case "concentric":
      return {
        name: "concentric",
        ...base,
        concentric: (node: cytoscape.NodeSingular) =>
          (node.data("hasState") ? 2 : 1) as number,
        levelWidth: () => 1,
      } as cytoscape.LayoutOptions;
    case "breadthfirst":
      return {
        name: "breadthfirst",
        ...base,
        directed: true,
      } as cytoscape.LayoutOptions;
    case "grid":
    default:
      return { name: "grid", ...base } as cytoscape.LayoutOptions;
  }
}

export default function GraphPanel({ registry }: { registry: PluginRegistry }) {
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
    () => () => service?.getSnapshot() ?? null,
    [service],
  );
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const data = React.useMemo(() => buildGraphData(snapshot), [snapshot]);

  const [query, setQuery] = React.useState("");
  const [layoutName, setLayoutName] = React.useState<LayoutName>("fcose");
  const [animate, setAnimate] = React.useState(true);
  const [view, setView] = React.useState<"graph" | "table">("graph");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (selectedId && !data.nodes.some((n) => n.id === selectedId)) {
      setSelectedId(null);
    }
  }, [data, selectedId]);

  const visibleNodes = data.nodes.filter((node) =>
    `${node.displayName} ${node.kind}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const names = new Map(data.nodes.map((node) => [node.id, node.displayName]));

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cyRef = React.useRef<cytoscape.Core | null>(null);

  // create / destroy cytoscape instance
  React.useEffect(() => {
    registerExtensions();
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-size": 10,
            "text-valign": "center",
            "text-halign": "center",
            color: "#18181b",
            width: 28,
            height: 28,
            "background-color": "#e4e4e7",
            "border-width": 1,
            "border-color": "#a1a1aa",
          },
        },
        {
          selector: "node[hasState]",
          style: {
            "background-color": "#dbeafe",
            "border-color": "#3b82f6",
          },
        },
        {
          selector: "node.selected",
          style: {
            "border-width": 3,
            "border-color": "#2563eb",
            "background-color": "#bfdbfe",
          },
        },
        {
          selector: "node.dimmed",
          style: { opacity: 0.25 },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "#a1a1aa",
            "target-arrow-color": "#a1a1aa",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            opacity: 0.7,
          },
        },
        {
          selector: "edge.dimmed",
          style: { opacity: 0.1 },
        },
      ],
      layout: { name: "grid" },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });
    cyRef.current = cy;

    cy.on("tap", "node", (evt) => {
      const id = evt.target.id() as string;
      setSelectedId(id);
    });
    cy.on("tap", (evt) => {
      if (evt.target === cy) setSelectedId(null);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // sync elements + visibility + selection, then run layout
  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const visibleSet = new Set(visibleNodes.map((n) => n.id));

    cy.batch(() => {
      cy.elements().remove();
      const elems: cytoscape.ElementDefinition[] = [
        ...data.nodes.map((n) => ({
          data: {
            id: n.id,
            label: n.displayName,
            kind: n.kind,
            hasState: n.hasState,
          },
        })),
        ...data.edges.map((e, i) => ({
          data: {
            id: `e${i}`,
            source: e.from,
            target: e.to,
          },
        })),
      ];
      cy.add(elems);

      // visibility based on search
      cy.nodes().forEach((n) => {
        if (!visibleSet.has(n.id())) n.style("display", "none");
        else n.style("display", "element");
      });
      // selection highlight
      cy.nodes().removeClass("selected dimmed");
      cy.edges().removeClass("dimmed");
      if (selectedId) {
        const sel = cy.getElementById(selectedId);
        const neighborhood = sel.closedNeighborhood();
        const others = cy.elements().not(neighborhood);
        others.addClass("dimmed");
        sel.addClass("selected");
      }
    });

    const selectedNode = selectedId ? cy.getElementById(selectedId) : null;
    const toLayout =
      selectedId && selectedNode && selectedNode.length > 0
        ? selectedNode.closedNeighborhood()
        : cy.elements();
    // run layout (interactive: concentric on neighbourhood when selected)
    let opts: cytoscape.LayoutOptions;
    if (selectedId && selectedNode && selectedNode.length > 0) {
      opts = {
        name: "concentric",
        animate,
        animationDuration: 450,
        fit: false,
        padding: 20,
        concentric: (node: cytoscape.NodeSingular) => {
          if (node.id() === selectedId) return 3;
          const sel = cy.getElementById(selectedId as string);
          if (sel.closedNeighborhood().contains(node)) return 2;
          return 1;
        },
        levelWidth: () => 1,
      } as cytoscape.LayoutOptions;
    } else {
      opts = layoutOptionsFor(layoutName, animate);
    }
    const layout = toLayout.layout(opts);
    layout.run();

    if (!selectedId) {
      const visibleNodesCy = cy.nodes().filter((n) => n.style("display") !== "none");
      if (visibleNodesCy.length > 0) cy.fit(visibleNodesCy, 30);
    }
  }, [data, visibleNodes, layoutName, animate, selectedId]);

  if (data.nodes.length === 0) {
    return (
      <div className="devtools:flex devtools:min-h-0 devtools:flex-col">
        <PanelHeader
          title="Component graph"
          description="Reactive dependencies of the selected component."
          actions={
            <Badge variant="secondary">
              {data.nodeCount} nodes · {data.edgeCount} edges
            </Badge>
          }
        />
        <EmptyState
          title="No graph data"
          description={
            data.reason ??
            "Connect the React bridge to inspect component relationships."
          }
        />
      </div>
    );
  }

  return (
    <div className="devtools:flex devtools:min-h-0 devtools:flex-col">
      <PanelHeader
        title="Component graph"
        description="Reactive dependencies of the selected component."
        actions={
          <Badge variant="secondary">
            {data.nodeCount} nodes · {data.edgeCount} edges
          </Badge>
        }
      />
      <Toolbar>
        <SearchField
          aria-label="Search graph nodes"
          placeholder="Search name or kind…"
          value={query}
          onChange={setQuery}
        />
        <div className="devtools:flex devtools:items-center devtools:gap-2">
          <label className="devtools:text-xs devtools:text-muted-foreground">
            Layout
            <select
              className="devtools:ml-1 devtools:rounded devtools:border devtools:border-border devtools:bg-background devtools:px-1 devtools:py-0.5 devtools:text-xs"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value as LayoutName)}
            >
              {LAYOUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="devtools:flex devtools:items-center devtools:gap-1 devtools:text-xs devtools:text-muted-foreground">
            <input
              type="checkbox"
              checked={animate}
              onChange={(e) => setAnimate(e.target.checked)}
            />
            Animate
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "graph" ? "table" : "graph")}
          >
            {view === "graph" ? "Table view" : "Graph view"}
          </Button>
          {selectedId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      </Toolbar>
      {view === "graph" ? (
        <div
          ref={containerRef}
          className="devtools:min-h-[320px] devtools:flex-1 devtools:rounded-md devtools:border devtools:border-border"
          style={{ height: 360, position: "relative" }}
        />
      ) : visibleNodes.length === 0 ? (
        <EmptyState
          title="No matching nodes"
          description="Try another component name or kind."
          action={
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="devtools:overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleNodes.map((node) => {
                const parent = data.edges.find((edge) => edge.to === node.id);
                return (
                  <TableRow key={node.id}>
                    <TableCell className="devtools:font-mono devtools:text-xs">
                      {node.displayName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{node.kind}</Badge>
                    </TableCell>
                    <TableCell className="devtools:text-xs devtools:text-muted-foreground">
                      {parent
                        ? (names.get(parent.from) ?? parent.from)
                        : "Root"}
                    </TableCell>
                    <TableCell className="devtools:text-xs">
                      {node.hasState ? "Stateful" : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
