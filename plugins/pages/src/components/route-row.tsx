import { Badge, Button, Input } from "@next-devtools/ui";
import type { PageRow } from "../pages-data.js";
import { resolveRouteTarget } from "../route-target.js";

type RouteRowProps = {
	page: PageRow;
	values: Readonly<Record<string, string>>;
	active: boolean;
	onParameterChange: (name: string, value: string) => void;
	onNavigate: (target: string) => void;
};

export function RouteRow({
	page,
	values,
	active,
	onParameterChange,
	onNavigate,
}: RouteRowProps) {
	const target = resolveRouteTarget(page, values);
	const navigable = target !== null;
	return (
		<li
			aria-current={active ? "page" : undefined}
			style={{
				background: active ? "var(--accent)" : "var(--card)",
				fontSize: 12,
				padding: "6px 8px",
				border: "1px solid var(--border, #e4e4e7)",
				borderRadius: 4,
				display: "flex",
				justifyContent: "space-between",
				flexWrap: "wrap",
				alignItems: "center",
				gap: 8,
			}}
		>
			<span
				style={{
					fontFamily: "monospace",
					overflowWrap: "anywhere",
					minWidth: 0,
				}}
			>
				{page.urlPattern}{" "}
				{active ? <Badge variant="secondary">Active</Badge> : null}
			</span>
			<span
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					flexWrap: "wrap",
				}}
			>
				{page.dynamicParamNames.map((name) => (
					<Input
						key={name}
						aria-label={`Route parameter ${name} for ${page.urlPattern}`}
						value={values[name] ?? ""}
						onChange={(event) => onParameterChange(name, event.target.value)}
						placeholder={name}
						style={{ width: 90, fontSize: 11, padding: "3px 5px" }}
					/>
				))}
				<span style={{ color: "var(--muted-foreground, #71717a)" }}>
					{page.fileRoles.join(", ")}
					{page.execution ? ` · ${page.execution}` : ""}
				</span>
				<Button
					type="button"
					onClick={() => target && onNavigate(target)}
					disabled={!navigable}
					title={
						navigable
							? `Navigate to ${page.urlPattern}`
							: "Enter route parameters first"
					}
				>
					Navigate
				</Button>
			</span>
		</li>
	);
}
