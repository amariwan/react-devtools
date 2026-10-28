import { describe, expect, it } from "vitest";
import { buildOverviewData } from "../../plugins/overview/src/overview-data";
import { buildPagesData } from "../../plugins/pages/src/pages-data";
import { buildNetworkData } from "../../plugins/network/src/network-data";
import { buildGraphData } from "../../plugins/graph/src/graph-data";
import { buildCssData } from "../../plugins/css-tailwind/src/css-data";
import { buildZustandData } from "../../plugins/state-zustand/src/zustand-data";
import { buildReduxData } from "../../plugins/state-redux/src/redux-data";
import { buildTanStackQueryData } from "../../plugins/state-tanstack-query/src/tanstack-query-data";
import { buildTimelineData } from "../../plugins/overview/src/timeline-data";

describe("panel data selectors", () => {
  it("normalizes timeline runtime data", () => {
    expect(
      buildTimelineData({
        status: "available",
        data: {
          recording: true,
          layers: [],
          events: [
            {
              id: "ev_1",
              layer: "navigation",
              type: "navigation",
              timestampUnixMs: 123,
              payload: { url: "/dashboard" },
            },
          ],
          filter: {},
          dropped: 2,
        },
        revision: 1,
      }),
    ).toMatchObject({ recording: true, count: 1, dropped: 2 });
  });
  it("overview reports service statuses", () => {
    const registry = {
      list: () => [],
      panels: { list: () => [] },
      commands: { list: () => [] },
      capabilities: { list: () => [] },
      services: {
        get: () => ({
          getSnapshot: () => ({ status: "available", data: {}, revision: 1 }),
        }),
      },
    } as never;
    const data = buildOverviewData(registry);
    expect(data.connectionStatus).toBe("connected");
    expect(data.services.length).toBeGreaterThan(0);
    expect(data.health.diagnosticCount).toBe(0);
  });

  it("overview exposes failed plugins and dropped diagnostics", () => {
    const registry = {
      list: () => [
        {
          plugin: { manifest: { id: "broken-plugin" } },
          status: "error",
          error: new Error("setup failed"),
        },
      ],
      panels: { list: () => [] },
      commands: { list: () => [] },
      capabilities: { list: () => [] },
      services: {
        get: (id: string) =>
          id === "next-devtools.runtime.diagnostics"
            ? {
                getSnapshot: () => ({
                  status: "available",
                  data: {
                    events: [{ sourceFrame: { origin: "source-map" } }],
                    dropped: 3,
                  },
                  revision: 1,
                }),
              }
            : {
                getSnapshot: () => ({
                  status: "available",
                  data: {},
                  revision: 1,
                }),
              },
      },
    } as never;
    const data = buildOverviewData(registry);
    expect(data.health.failedPlugins).toEqual([
      { id: "broken-plugin", message: "setup failed" },
    ]);
    expect(data.health.droppedDiagnostics).toBe(3);
    expect(data.health.sourceMappedDiagnosticCount).toBe(1);
  });

  it("pages builds rows from route snapshot", () => {
    const snapshot = {
      status: "available",
      data: {
        tree: {
          nodes: [
            {
              id: "root",
              relativePath: "",
              name: "app",
              kind: "root",
              parentId: null,
              urlSegment: "",
              dynamicParamNames: [],
              isIntercepted: false,
              fileRoles: [],
              sourceLocation: { relativePath: "app", line: 1, column: 1 },
            },
            {
              id: "about",
              relativePath: "about",
              name: "about",
              kind: "static",
              parentId: "root",
              urlSegment: "about",
              dynamicParamNames: [],
              isIntercepted: false,
              fileRoles: ["page"],
              execution: "client",
              sourceLocation: {
                relativePath: "app/about/page.tsx",
                line: 1,
                column: 1,
              },
            },
            {
              id: "docs/[[...slug]]",
              relativePath: "docs/[[...slug]]",
              name: "[[...slug]]",
              kind: "optional-catch-all",
              parentId: "root",
              urlSegment: "[...slug]",
              dynamicParamNames: ["slug"],
              isIntercepted: false,
              fileRoles: ["page"],
              sourceLocation: {
                relativePath: "app/docs/[[...slug]]/page.tsx",
                line: 1,
                column: 1,
              },
            },
          ],
        },
        pathname: "/about",
        activeSegmentIds: [],
        params: {},
        searchParams: {},
      },
      revision: 1,
    } as never;
    const data = buildPagesData(snapshot);
    expect(data.pageCount).toBe(2);
    expect(data.pages[0]?.urlPattern).toBe("/about");
    expect(data.pages[0]?.execution).toBe("client");
    expect(data.activePathname).toBe("/about");
    expect(data.pages[1]?.urlPattern).toBe("/[...slug]");
    expect(data.pages[1]?.optionalParamNames).toEqual(["slug"]);
  });

  it("pages returns empty when no snapshot", () => {
    const data = buildPagesData(null);
    expect(data.pages).toHaveLength(0);
    expect(data.status).toBe("unavailable");
  });

  it("network builds entries", () => {
    const snapshot = {
      status: "available",
      data: {
        recording: true,
        entries: [
          {
            id: "net_1",
            url: "http://x",
            initiatorType: "fetch",
            startTime: 0,
            duration: 10,
            transferSize: 5,
            encodedBodySize: 5,
            decodedBodySize: 5,
            capturedAtUnixMs: 1,
          },
        ],
        dropped: 0,
      },
      revision: 1,
    } as never;
    const data = buildNetworkData(snapshot);
    expect(data.count).toBe(1);
    expect(data.recording).toBe(true);
  });

  it("graph builds nodes and edges", () => {
    const snapshot = {
      status: "available",
      data: {
        capabilities: {},
        roots: [],
        tree: [
          {
            id: "a",
            displayName: "A",
            kind: "function",
            parentId: null,
            childIds: ["b"],
            hasState: false,
          },
          {
            id: "b",
            displayName: "B",
            kind: "host",
            parentId: "a",
            childIds: [],
            hasState: true,
          },
        ],
      },
      revision: 1,
    } as never;
    const data = buildGraphData(snapshot);
    expect(data.nodeCount).toBe(2);
    expect(data.edgeCount).toBe(1);
  });

  it("css detects tailwind and tokens", () => {
    const data = buildCssData({
      stylesheets: [
        ":root { --color-primary: red; }",
        "/* tailwindcss */\n.flex{display:flex}",
      ],
    });
    expect(data.tailwindDetected).toBe(true);
    expect(data.tokens).toContain("--color-primary");
  });

  it("zustand filters adapters", () => {
    const snapshot = {
      status: "available",
      data: {
        adapters: [
          { id: "zustand:store", label: "Zustand Store", canMutate: true },
          { id: "redux:store", label: "Redux Store", canMutate: false },
        ],
        selectedAdapterId: undefined,
        canMutate: false,
        loading: false,
      },
      revision: 1,
    } as never;
    const data = buildZustandData(snapshot, [{ a: 1 }]);
    expect(data.adapters).toHaveLength(1);
    expect(data.globalCount).toBe(1);
    expect(data.hasStores).toBe(true);
  });

  it("redux detects global", () => {
    const data = buildReduxData(null, true);
    expect(data.hasStores).toBe(true);
    expect(data.hasGlobalStore).toBe(true);
  });

  it("tanstack query detects global", () => {
    const data = buildTanStackQueryData(null, true);
    expect(data.hasData).toBe(true);
    expect(data.globalDetected).toBe(true);
  });
});
