"use client";

import * as React from "react";
import { DEFAULT_DOCK_SIZE, type DockPosition } from "../helpers/prefs";
import { cn } from "../lib/utils.js";

const DOCK_ANIMATION_CLASS: Record<DockPosition, string> = {
	bottom: "devtools:animate-devtools-dock-enter-bottom",
	left: "devtools:animate-devtools-dock-enter-left",
	right: "devtools:animate-devtools-dock-enter-right",
};

/** A bounded, resizable workspace; resizing never animates the inspected app. */
export function Dock({
	children,
	position = "bottom",
	size: sizeProp = DEFAULT_DOCK_SIZE,
}: {
	children: React.ReactNode;
	position?: DockPosition;
	/** Initial docked size as a percentage of the viewport. */
	size?: number;
}) {
	const [size, setSize] = React.useState(sizeProp);
	const horizontal = position !== "bottom";
	const drag = React.useRef<{ coordinate: number; size: number } | null>(null);
	const clamp = (value: number) => Math.max(35, Math.min(94, value));
	return (
		<section
			aria-label="Next.js DevTools"
			data-dock={position}
			style={{
				bottom: "2.5rem",
				...(horizontal
					? {
							top: "0.5rem",
							[position]: "0.5rem",
							width: `70%`,
						}
					: {
							width: "70%",
							height: `min(${size}dvh, calc(100dvh - 3rem))`,
						}),
				minWidth: "min(280px, calc(100vw - 1rem))",
				maxHeight: "calc(100dvh - 3rem)",
				boxShadow: "var(--shadow-lg)",
			}}
			className={cn(
				!horizontal && "devtools:left-2 devtools:right-2 devtools:mx-auto",
				"devtools:origin-center",
				DOCK_ANIMATION_CLASS[position],
				"devtools:@container/devtools devtools:fixed devtools:z-[2147483646] devtools:flex devtools:flex-col devtools:overflow-hidden devtools:rounded-lg devtools:border devtools:border-border devtools:bg-background devtools:text-foreground",
			)}
		>
			<div
				role="separator"
				tabIndex={0}
				aria-label="Resize DevTools"
				aria-orientation={horizontal ? "vertical" : "horizontal"}
				aria-valuemin={35}
				aria-valuemax={94}
				aria-valuenow={Math.round(size)}
				aria-valuetext={`${Math.round(size)} percent of viewport`}
				className="devtools:absolute devtools:z-10 devtools:touch-none devtools:hover:bg-primary/30 devtools:focus-visible:bg-primary/30"
				style={
					horizontal
						? {
								top: 0,
								bottom: 0,
								[position === "right" ? "left" : "right"]: 0,
								width: 5,
								cursor: "col-resize",
							}
						: { top: 0, left: 0, right: 0, height: 5, cursor: "row-resize" }
				}
				onPointerDown={(event) => {
					event.preventDefault();
					drag.current = {
						coordinate: horizontal ? event.clientX : event.clientY,
						size,
					};
					event.currentTarget.setPointerCapture(event.pointerId);
				}}
				onPointerMove={(event) => {
					if (!drag.current) return;
					const delta =
						(horizontal ? event.clientX : event.clientY) -
						drag.current.coordinate;
					const direction = position === "left" ? 1 : -1;
					setSize(
						clamp(
							drag.current.size +
								((direction * delta) /
									(horizontal ? window.innerWidth : window.innerHeight)) *
									100,
						),
					);
				}}
				onPointerUp={() => {
					drag.current = null;
				}}
				onLostPointerCapture={() => {
					drag.current = null;
				}}
				onKeyDown={(event) => {
					const increase = horizontal
						? position === "left"
							? "ArrowRight"
							: "ArrowLeft"
						: "ArrowUp";
					const decrease = horizontal
						? position === "left"
							? "ArrowLeft"
							: "ArrowRight"
						: "ArrowDown";
					if (![increase, decrease, "Home", "End"].includes(event.key)) return;
					event.preventDefault();
					setSize((value) =>
						event.key === "Home"
							? 35
							: event.key === "End"
								? 94
								: clamp(value + (event.key === increase ? 5 : -5)),
					);
				}}
			/>
			{children}
		</section>
	);
}
