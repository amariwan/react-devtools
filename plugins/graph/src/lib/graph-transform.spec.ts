import { describe, expect, it } from "vitest";
import {
	buildGraphView,
	computeRequiredComponents,
	countByNodeKind,
	describeEmptyReason,
	describeLimitations,
	edgeKindTitle,
	edgesForNode,
	findNodeByLabel,
	nodeById,
	nodeKindTitle,
} from "./graph-transform";

describe("graph transform", () => {
	it("computes required components", () => {
		const r = computeRequiredComponents(undefined, new Map(), 2);
		expect(r).toBeTruthy();
	});

	it("builds empty view", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(view).toBeTruthy();
	});

	it("builds view with root set", () => {
		const dep = {
			component: {
				id: "root",
				displayName: "Root",
				kind: "function",
				hasState: true,
			},
			nodes: [
				{
					id: "root",
					kind: "component",
					label: "Root",
					componentId: "root",
					evidence: "observed",
					evidenceSource: "fiber",
				},
			],
			edges: [],
			limitations: [],
			truncated: false,
		};
		const sets = new Map([["root", dep]]);
		const view = buildGraphView({
			rootComponentId: "root",
			sets,
			depth: 2,
			nodeKinds: new Set(["component"]),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(view.nodeCount).toBeGreaterThan(0);
	});

	it("builds view with child component", () => {
		const childDep = {
			component: {
				id: "child",
				displayName: "Child",
				kind: "function",
				hasState: false,
			},
			nodes: [
				{
					id: "child",
					kind: "component",
					label: "Child",
					componentId: "child",
					evidence: "observed",
					evidenceSource: "fiber",
				},
			],
			edges: [],
			limitations: [],
			truncated: true,
		};
		const rootDep = {
			component: {
				id: "root",
				displayName: "Root",
				kind: "function",
				hasState: true,
			},
			nodes: [
				{
					id: "root",
					kind: "component",
					label: "Root",
					componentId: "root",
					evidence: "observed",
					evidenceSource: "fiber",
				},
				{
					id: "child",
					kind: "component",
					label: "Child",
					componentId: "child",
					evidence: "observed",
					evidenceSource: "fiber",
				},
			],
			edges: [
				{
					id: "e1",
					source: "root",
					target: "child",
					kind: "reads",
					evidence: "observed",
					evidenceSource: "fiber",
				},
			],
			limitations: ["truncated"],
			truncated: false,
		};
		const sets = new Map([
			["root", rootDep],
			["child", childDep],
		]);
		const view = buildGraphView({
			rootComponentId: "root",
			sets,
			depth: 3,
			nodeKinds: new Set([
				"component",
				"state",
				"memo",
				"callback",
				"effect",
				"prop",
				"reducer",
				"context",
				"external-store",
				"selector",
			]),
			edgeKinds: new Set([
				"reads",
				"consumes",
				"subscribes",
				"depends-on",
				"observed-update",
			]),
			query: "root",
			nodeLimit: 100,
			selectedNodeId: "child",
		} as never);
		expect(view.nodeCount).toBeGreaterThan(1);
		expect(view.edgeCount).toBeGreaterThan(0);
	});

	it("builds empty view with status/reason", () => {
		const view = buildGraphView({
			rootComponentId: "missing",
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
			status: "loading",
			reason: "no data",
		} as never);
		expect(view.status).toBe("loading");
		expect(view.reason).toBe("no data");
	});

	it("edgesForNode returns array", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(Array.isArray(edgesForNode(view, "x"))).toBe(true);
	});

	it("nodeById returns undefined for missing", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(nodeById(view, "nope")).toBeUndefined();
	});

	it("findNodeByLabel returns undefined", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(findNodeByLabel(view, "nope")).toBeUndefined();
	});

	it("describeEmptyReason returns string", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(
			typeof describeEmptyReason(view, {
				runtimeStatus: "available",
				dependenciesCapable: true,
				dependencySetLoaded: true,
				hiddenByKind: 0,
			}),
		).toBe("string");
	});

	it("countByNodeKind returns record", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(countByNodeKind(view)).toBeTruthy();
	});

	it("nodeKindTitle and edgeKindTitle", () => {
		expect(typeof nodeKindTitle("component")).toBe("string");
		expect(typeof edgeKindTitle("reads")).toBe("string");
	});

	it("describeLimitations returns array", () => {
		const view = buildGraphView({
			sets: new Map(),
			depth: 2,
			nodeKinds: new Set(),
			edgeKinds: new Set(),
			query: "",
			nodeLimit: 10,
		} as never);
		expect(Array.isArray(describeLimitations(view, []))).toBe(true);
	});
});
