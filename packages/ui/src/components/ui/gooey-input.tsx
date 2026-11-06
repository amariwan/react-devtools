"use client";

import { SearchIcon, XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils.js";
import { IconButton } from "./icon-button.js";
import { Input } from "./input.js";

export interface GooeyInputProps {
	value: string;
	onChange: (value: string) => void;
	onOpen?: () => void;
	placeholder?: string;
	collapsedWidth?: number;
	expandedWidth?: number;
	className?: string;
}

export function GooeyInput({
	value,
	onChange,
	onOpen,
	placeholder = "Search…",
	collapsedWidth = 34,
	expandedWidth = 220,
	className,
}: GooeyInputProps) {
	const [open, setOpen] = React.useState(false);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const expand = React.useCallback(() => {
		setOpen(true);
		onOpen?.();
		requestAnimationFrame(() => inputRef.current?.focus());
	}, [onOpen]);
	const collapse = React.useCallback(() => {
		setOpen(false);
		onChange("");
	}, [onChange]);

	React.useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				collapse();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, collapse]);

	const showClear = open && value.length > 0;

	return (
		<div
			className={cn(
				"devtools:flex devtools:h-8 devtools:items-center devtools:overflow-hidden devtools:rounded-md devtools:border devtools:border-input devtools:bg-background devtools:transition-[width] devtools:duration-150 devtools:motion-reduce:transition-none",
				open && "devtools:gap-0.5 devtools:pr-0.5",
				className,
			)}
			style={{
				width: open ? expandedWidth : collapsedWidth,
			}}
		>
			{open ? (
				<>
					<Input
						ref={inputRef}
						type="text"
						role="searchbox"
						aria-label={placeholder}
						value={value}
						onChange={(event) => onChange(event.target.value)}
						placeholder={placeholder}
						className="devtools:h-full devtools:min-w-0 devtools:flex-1 devtools:border-0 devtools:bg-transparent devtools:px-2 devtools:py-0 devtools:shadow-none devtools:focus-visible:border-transparent devtools:focus-visible:ring-0"
					/>
					{showClear ? (
						<IconButton
							icon={XIcon}
							label="Clear search"
							size="icon-sm"
							onClick={() => onChange("")}
						/>
					) : null}
					<IconButton
						icon={XIcon}
						label="Close search"
						size="icon-sm"
						onClick={collapse}
					/>
				</>
			) : (
				<IconButton
					icon={SearchIcon}
					label="Search panels and commands"
					onClick={expand}
				/>
			)}
		</div>
	);
}
