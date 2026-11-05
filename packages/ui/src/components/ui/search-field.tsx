"use client";

import { SearchIcon, XIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "../../lib/utils.js";
import { Input } from "./input.js";

export interface SearchFieldProps
	extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}

export function SearchField({
	value,
	onChange,
	placeholder,
	className,
	...props
}: SearchFieldProps) {
	return (
		<div className={cn("devtools:relative", className)}>
			<SearchIcon
				className="devtools:pointer-events-none devtools:absolute devtools:top-1/2 devtools:left-2.5 devtools:size-3.5 devtools:-translate-y-1/2 devtools:text-muted-foreground"
				aria-hidden
			/>
			<Input
				aria-label={props["aria-label"] ?? placeholder ?? "Search"}
				autoComplete="off"
				spellCheck={false}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder ?? "Search…"}
				className="devtools:pl-8 devtools:pr-9"
				{...props}
			/>
			{value ? (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label="Clear search"
					className="devtools:absolute devtools:top-1/2 devtools:right-1.5 devtools:-translate-y-1/2 devtools:flex devtools:size-7 devtools:items-center devtools:justify-center devtools:rounded devtools:text-muted-foreground devtools:hover:text-foreground"
				>
					<XIcon className="devtools:size-3.5" aria-hidden />
				</button>
			) : null}
		</div>
	);
}
