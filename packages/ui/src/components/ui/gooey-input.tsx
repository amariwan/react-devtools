"use client";

import { SearchIcon, XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils.js";

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
	const reactId = React.useId();
	const filterId = `devtools-gooey-${reactId.replace(/:/g, "")}`;

	const expand = () => {
		setOpen(true);
		onOpen?.();
		requestAnimationFrame(() => inputRef.current?.focus());
	};
	const collapse = () => {
		setOpen(false);
		onChange("");
	};

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
	}, [open]);

	const showClear = open && value.length > 0;

	return (
		<div
			className={cn(
				"devtools:relative devtools:inline-flex devtools:items-center",
				className,
			)}
		>
			<svg
				aria-hidden
				className="devtools:absolute devtools:h-0 devtools:w-0"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<filter id={filterId}>
						<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
							result="gooey"
						/>
						<feComposite in="SourceGraphic" in2="gooey" operator="atop" />
					</filter>
				</defs>
			</svg>

			{/* Gooey shapes layer */}
			<div
				className="devtools:relative devtools:flex devtools:items-center"
				style={{ filter: `url(#${filterId})` }}
			>
				<div
					className={cn(
						"devtools:rounded-full devtools:bg-muted devtools:transition-[width] devtools:duration-300",
						open ? "devtools:opacity-100" : "devtools:opacity-0",
					)}
					style={{
						width: open ? expandedWidth : 0,
						height: collapsedWidth,
						transition:
							"width 300ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease",
					}}
				/>
				<button
					type="button"
					aria-label="Search panels and commands"
					onClick={open ? collapse : expand}
					className="devtools:relative devtools:z-10 devtools:flex devtools:shrink-0 devtools:items-center devtools:justify-center devtools:rounded-full devtools:bg-primary devtools:text-primary-foreground devtools:transition-transform devtools:duration-200 devtools:ease-out hover:devtools:scale-105"
					style={{
						width: collapsedWidth,
						height: collapsedWidth,
						marginLeft: open ? -16 : 0,
					}}
				>
					{showClear ? (
						<XIcon className="devtools:size-4" aria-hidden />
					) : (
						<SearchIcon className="devtools:size-4" aria-hidden />
					)}
				</button>
			</div>

			{/* Unfiltered content layer on top */}
			{open ? (
				<input
					ref={inputRef}
					type="search"
					aria-label={placeholder}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						if (!open) expand();
					}}
					placeholder={placeholder}
					className="devtools:absolute devtools:top-0 devtools:left-3 devtools:h-full devtools:bg-transparent devtools:text-sm devtools:text-foreground devtools:outline-none devtools:placeholder:text-muted-foreground"
					style={{ width: expandedWidth - 40 }}
				/>
			) : null}

			{showClear ? (
				<button
					type="button"
					onClick={() => onChange("")}
					aria-label="Clear search"
					className="devtools:absolute devtools:top-1/2 devtools:-translate-y-1/2 devtools:flex devtools:size-6 devtools:items-center devtools:justify-center devtools:rounded devtools:text-muted-foreground devtools:hover:text-foreground"
					style={{ right: 40 }}
				>
					<XIcon className="devtools:size-3" aria-hidden />
				</button>
			) : null}
		</div>
	);
}
