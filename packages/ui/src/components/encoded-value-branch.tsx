import type { EncodedValue } from "@next-devtools/contracts";
import { Copy } from "lucide-react";
import * as React from "react";
import {
	type ValueKind,
	childrenOf,
	summarizeValue,
} from "../helpers/value-format.js";
import { IconButton } from "./primitives";
import { Button } from "./ui/button";

const VALUE_KIND_CLASS: Record<ValueKind, string> = {
	null: "devtools:text-muted-foreground",
	undefined: "devtools:text-muted-foreground",
	boolean: "devtools:text-warning",
	number: "devtools:text-primary",
	string: "devtools:text-success",
	bigint: "devtools:text-primary",
	date: "devtools:text-info",
	regexp: "devtools:text-info",
	error: "devtools:text-destructive",
	symbol: "devtools:text-warning",
	function: "devtools:text-info",
	array: "devtools:text-foreground",
	map: "devtools:text-foreground",
	set: "devtools:text-foreground",
	object: "devtools:text-foreground",
	ref: "devtools:text-muted-foreground",
};

function CopyValueButton({
	value,
	path,
	onCopy,
}: {
	value: EncodedValue;
	path: string;
	onCopy: (value: EncodedValue, path: string) => void;
}) {
	return (
		<IconButton
			icon={Copy}
			label={`Copy JSON at ${path}`}
			size="icon-xs"
			onClick={() => onCopy(value, path)}
			className="devtools:shrink-0"
		/>
	);
}

/** Structured view for encoded runtime values, bounded for large snapshots. */
export function EncodedValueBranch({
	value,
	depth = 0,
	path,
	onCopy,
}: {
	value: EncodedValue;
	depth?: number;
	path: string;
	onCopy: (value: EncodedValue, path: string) => void;
}) {
	const [open, setOpen] = React.useState(depth === 0);
	const [limit, setLimit] = React.useState(100);
	const summary = summarizeValue(value);
	const children = React.useMemo(
		() => (open && depth < 20 ? childrenOf(value) : []),
		[open, depth, value],
	);
	if (!summary.expandable)
		return (
			<div className="devtools:flex devtools:min-w-0 devtools:items-center devtools:gap-1">
				<span
					className={`devtools:min-w-0 devtools:flex-1 devtools:break-all ${VALUE_KIND_CLASS[summary.kind]}`}
				>
					{summary.label}
				</span>
				<CopyValueButton value={value} path={path} onCopy={onCopy} />
			</div>
		);
	if (depth >= 20)
		return (
			<div className="devtools:flex devtools:min-w-0 devtools:items-center devtools:gap-1">
				<span className="devtools:min-w-0 devtools:flex-1 devtools:break-all devtools:text-muted-foreground">
					{summary.label} · depth limit reached
				</span>
				<CopyValueButton value={value} path={path} onCopy={onCopy} />
			</div>
		);
	return (
		<div className="devtools:@container/encoded-value devtools:flex devtools:min-w-0 devtools:items-start devtools:gap-1">
			<details
				open={open}
				onToggle={(event) => setOpen(event.currentTarget.open)}
				className="devtools:min-w-0 devtools:flex-1"
			>
				<summary
					className={`devtools:cursor-pointer devtools:rounded devtools:py-1 devtools:break-all devtools:hover:bg-accent ${VALUE_KIND_CLASS[summary.kind]}`}
				>
					{summary.label}
				</summary>
				{open && (
					<div className="devtools:ml-2 devtools:border-l devtools:border-border devtools:pl-3">
						{children.slice(0, limit).map((child) => (
							<div
								key={child.key}
								className="devtools:flex devtools:items-baseline devtools:gap-2 devtools:py-0.5 devtools:@max-[400px]/encoded-value:flex-col devtools:@max-[400px]/encoded-value:items-stretch devtools:@max-[400px]/encoded-value:gap-0"
							>
								<span className="devtools:min-w-0 devtools:basis-2/5 devtools:shrink-0 devtools:break-words devtools:text-muted-foreground devtools:@max-[400px]/encoded-value:basis-auto devtools:@max-[400px]/encoded-value:max-w-full devtools:@max-[400px]/encoded-value:font-sans">
									{child.key}:
								</span>
								<div className="devtools:min-w-0 devtools:flex-1 devtools:@max-[400px]/encoded-value:w-full">
									<EncodedValueBranch
										value={child.value}
										depth={depth + 1}
										path={`${path}.${child.key}`}
										onCopy={onCopy}
									/>
								</div>
							</div>
						))}
						{children.length > limit && (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								onClick={() => setLimit((current) => current + 100)}
							>
								Show next {Math.min(100, children.length - limit)} properties
							</Button>
						)}
					</div>
				)}
			</details>
			<CopyValueButton value={value} path={path} onCopy={onCopy} />
		</div>
	);
}
