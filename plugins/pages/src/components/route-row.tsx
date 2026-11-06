import {
	CircleCheck,
	ExternalLink,
	IconButton,
	Input,
} from "@next-devtools/ui";
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
			className={`devtools:flex devtools:flex-wrap devtools:items-center devtools:justify-between devtools:gap-2 devtools:rounded-sm devtools:border devtools:border-border devtools:px-2 devtools:py-1.5 devtools:text-xs ${active ? "devtools:bg-accent" : "devtools:bg-card"}`}
		>
			<span className="devtools:min-w-0 devtools:break-all devtools:font-mono">
				{page.urlPattern}
				{active ? (
					<CircleCheck
						className="devtools:ml-1 devtools:inline devtools:size-3.5 devtools:text-success"
						aria-hidden="true"
					/>
				) : null}
			</span>
			<span className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2">
				{page.dynamicParamNames.map((name) => (
					<Input
						key={name}
						aria-label={`Route parameter ${name} for ${page.urlPattern}`}
						value={values[name] ?? ""}
						onChange={(event) => onParameterChange(name, event.target.value)}
						placeholder={name}
						className="devtools:h-7 devtools:w-[90px] devtools:px-1.5 devtools:text-[11px]"
					/>
				))}
				<span className="devtools:text-muted-foreground">
					{page.fileRoles.join(", ")}
					{page.execution ? ` · ${page.execution}` : ""}
				</span>
				<IconButton
					type="button"
					icon={ExternalLink}
					label="Navigate"
					onClick={() => target && onNavigate(target)}
					disabled={!navigable}
					title={
						navigable
							? `Navigate to ${page.urlPattern}`
							: "Enter route parameters first"
					}
				/>
			</span>
		</li>
	);
}
