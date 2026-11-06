import { RUNTIME_SERVICE_IDS } from "@next-devtools/contracts";
import type { PluginRegistry } from "@next-devtools/core";
import type { DiagnosticsRuntime } from "@next-devtools/core";
import {
	Badge,
	CircleCheck,
	EmptyState,
	IconButton,
	Info,
	PanelHeader,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Workflow,
} from "@next-devtools/ui";
import * as React from "react";
import { buildAgentMcpHealthData } from "./agent-mcp-data.js";
import { createAgentMcpToolSurface } from "./agent-mcp-tools.js";

export default function AgentMcpPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const [, refresh] = React.useReducer((value) => value + 1, 0);
	React.useEffect(() => {
		const disposers = [
			registry.capabilities.onChange(() => refresh()),
			registry.services.subscribe(() => refresh()),
		];
		for (const id of [
			"next-devtools.runtime.react",
			"next-devtools.runtime.routes",
			"next-devtools.runtime.timeline",
			"next-devtools.runtime.network",
			"next-devtools.runtime.stores",
			"next-devtools.runtime.sessions",
			"next-devtools.runtime.diagnostics",
		]) {
			const service = registry.services.get<{
				subscribe(listener: () => void): () => void;
			}>(id);
			if (service) disposers.push(service.subscribe(() => refresh()));
		}
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, [registry]);

	const data = buildAgentMcpHealthData(registry);
	const tools = createAgentMcpToolSurface(registry).listTools();
	const diagnostics = registry.services.get<DiagnosticsRuntime>(
		RUNTIME_SERVICE_IDS.diagnostics,
	);
	const diagnosticEvents = diagnostics?.getSnapshot().data.events ?? [];
	const availableServiceCount = data.services.filter(
		(service) => service.status === "available",
	).length;
	return (
		<div className="devtools:flex devtools:min-h-0 devtools:flex-col">
			<PanelHeader
				title="Agent / MCP"
				description="Read-only diagnostics."
				actions={
					<>
						<Badge variant="secondary">
							<Workflow aria-hidden="true" className="devtools:size-3" />
							{availableServiceCount}
							<span className="devtools:sr-only"> services available</span>
						</Badge>
						<IconButton
							icon={Info}
							label="MCP transport is not enabled by this panel."
							size="icon-xs"
						/>
					</>
				}
			/>
			<section
				aria-labelledby="diagnostics-heading"
				className="devtools:border-b devtools:border-border"
			>
				<h3
					id="diagnostics-heading"
					className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:font-semibold"
				>
					Recent diagnostics{" "}
					<Badge variant="outline">{diagnosticEvents.length}</Badge>
				</h3>
				{diagnosticEvents.length === 0 ? (
					<EmptyState
						icon={CircleCheck}
						compact
						layout="inline"
						title="No errors"
						description="Browser errors and unhandled rejections appear here."
					/>
				) : (
					<ul className="devtools:m-0 devtools:list-none devtools:divide-y devtools:divide-border devtools:p-0">
						{[...diagnosticEvents]
							.reverse()
							.slice(0, 20)
							.map((event) => (
								<li
									key={event.id}
									className="devtools:space-y-1 devtools:px-3 devtools:py-2 devtools:text-xs"
								>
									<div className="devtools:flex devtools:items-center devtools:gap-2">
										<Badge variant="destructive">{event.kind}</Badge>
										<span className="devtools:font-medium">
											{event.name ?? "Error"}
										</span>
									</div>
									<p className="devtools:break-words">{event.message}</p>
									{event.route && (
										<p className="devtools:font-mono devtools:text-muted-foreground">
											{event.route}
										</p>
									)}
									<p className="devtools:break-all devtools:font-mono devtools:text-muted-foreground">
										{event.sourceFrame
											? `${event.sourceFrame.origin === "source-map" ? "Source-mapped" : "Unmapped"}: ${event.sourceFrame.source}:${event.sourceFrame.line}:${event.sourceFrame.column}`
											: "Source location unavailable"}
									</p>
								</li>
							))}
					</ul>
				)}
			</section>
			<section aria-labelledby="services-heading">
				<h3
					id="services-heading"
					className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:font-semibold"
				>
					Runtime services
				</h3>
				<CompactStatusList
					label="Runtime service status"
					rows={data.services.map((service) => ({
						id: service.id,
						displayId: service.id.startsWith("next-devtools.runtime.")
							? service.id.slice("next-devtools.runtime.".length)
							: service.id,
						status: service.status,
						details:
							[
								service.reason,
								service.droppedEvents !== undefined
									? `${service.droppedEvents} dropped`
									: undefined,
							]
								.filter(Boolean)
								.join(" · ") || undefined,
					}))}
				/>
				<div className="devtools:@max-[760px]/devtools:hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.services.map((service) => (
								<TableRow key={service.id}>
									<TableCell className="devtools:whitespace-nowrap devtools:font-mono devtools:text-xs">
										{service.id}
									</TableCell>
									<TableCell className="devtools:whitespace-nowrap">
										<Badge
											variant={
												service.status === "error" ? "destructive" : "outline"
											}
										>
											{service.status}
										</Badge>
									</TableCell>
									<TableCell className="devtools:text-xs devtools:text-muted-foreground">
										{service.reason}
										{service.droppedEvents !== undefined
											? ` · ${service.droppedEvents} dropped`
											: ""}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</section>
			<section aria-labelledby="plugins-heading">
				<h3
					id="plugins-heading"
					className="devtools:px-3 devtools:py-2 devtools:text-xs devtools:font-semibold"
				>
					Plugins <Badge variant="outline">{data.plugins.length}</Badge>
				</h3>
				<CompactStatusList
					label="Plugin status"
					rows={data.plugins.map((plugin) => ({
						id: plugin.id,
						status: plugin.status,
						details: plugin.reason,
					}))}
				/>
				<div className="devtools:@max-[760px]/devtools:hidden">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Plugin</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.plugins.map((plugin) => (
								<TableRow key={plugin.id}>
									<TableCell className="devtools:whitespace-nowrap devtools:font-mono devtools:text-xs">
										{plugin.id}
									</TableCell>
									<TableCell className="devtools:whitespace-nowrap">
										<Badge variant="outline">{plugin.status}</Badge>
									</TableCell>
									<TableCell className="devtools:text-xs devtools:text-muted-foreground">
										{plugin.reason ?? "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</section>
			<section
				aria-labelledby="tools-heading"
				className="devtools:border-t devtools:border-border devtools:p-3"
			>
				<h3
					id="tools-heading"
					className="devtools:mb-2 devtools:text-xs devtools:font-semibold"
				>
					Read-only tools <Badge variant="outline">{tools.length}</Badge>
				</h3>
				<ul className="devtools:flex devtools:list-none devtools:flex-wrap devtools:gap-2 devtools:p-0">
					{tools.map((tool) => (
						<li key={tool.name}>
							<Badge variant="secondary" className="devtools:font-mono">
								{tool.name}
							</Badge>
						</li>
					))}
				</ul>
				<p className="devtools:mt-2 devtools:text-xs devtools:text-muted-foreground">
					{data.capabilities.length} capabilities registered.
				</p>
			</section>
		</div>
	);
}

type CompactStatusRow = {
	readonly id: string;
	readonly displayId?: string;
	readonly status: string;
	readonly details?: string | undefined;
};

function CompactStatusList({
	label,
	rows,
}: {
	label: string;
	rows: readonly CompactStatusRow[];
}) {
	return (
		<ul
			aria-label={label}
			className="devtools:m-0 devtools:hidden devtools:list-none devtools:divide-y devtools:divide-border devtools:p-0 devtools:@max-[760px]/devtools:block"
		>
			{rows.map((row) => (
				<li
					key={row.id}
					className="devtools:grid devtools:gap-1.5 devtools:px-3 devtools:py-2"
				>
					<div className="devtools:flex devtools:min-w-0 devtools:items-center devtools:justify-between devtools:gap-2">
						<code
							title={row.id}
							className="devtools:min-w-0 devtools:break-all devtools:text-[11px]"
						>
							{row.displayId ? (
								<>
									<span aria-hidden="true">{row.displayId}</span>
									<span className="devtools:sr-only">{row.id}</span>
								</>
							) : (
								row.id
							)}
						</code>
						<Badge
							variant={
								row.status === "error" || row.status === "failed"
									? "destructive"
									: "outline"
							}
						>
							{row.status}
						</Badge>
					</div>
					{row.details && (
						<p className="devtools:m-0 devtools:text-[11px] devtools:text-muted-foreground">
							{row.details}
						</p>
					)}
				</li>
			))}
		</ul>
	);
}
