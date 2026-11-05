"use client";

import { cn } from "../../lib/utils.js";

export interface SwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	/** Accessible name. */
	label?: string;
	disabled?: boolean;
	className?: string;
}

export function Switch({
	checked,
	onCheckedChange,
	label,
	disabled,
	className,
}: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"devtools:inline-flex devtools:h-5 devtools:w-9 devtools:shrink-0 devtools:cursor-pointer devtools:items-center devtools:rounded-full devtools:border devtools:border-transparent devtools:p-0.5 devtools:transition-colors devtools:outline-none devtools:focus-visible:ring-3 devtools:focus-visible:ring-ring/50 devtools:disabled:cursor-not-allowed devtools:disabled:opacity-50",
				checked ? "devtools:bg-primary" : "devtools:bg-input",
				className,
			)}
		>
			<span
				className={cn(
					"devtools:block devtools:size-4 devtools:rounded-full devtools:bg-white devtools:shadow devtools:transition-transform",
					checked ? "devtools:translate-x-4" : "devtools:translate-x-0",
				)}
			/>
		</button>
	);
}
