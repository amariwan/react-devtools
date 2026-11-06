"use client";

import * as React from "react";
import { DEFAULT_DOCK_SIZE, type DockPosition } from "../helpers/prefs";

const MIN_DOCK_SIZE = 35;
const MAX_DOCK_SIZE = 94;
const clamp = (value: number) =>
	Math.max(MIN_DOCK_SIZE, Math.min(MAX_DOCK_SIZE, value));

/** A bounded, resizable workspace; resizing never animates the inspected app. */
export function Dock({
	children,
	position = "bottom",
	size: initialSize = DEFAULT_DOCK_SIZE,
}: {
	children: React.ReactNode;
	position?: DockPosition;
	/** Initial docked size as a percentage of the viewport. */
	size?: number;
}) {
	const [size, setSize] = React.useState(() => clamp(initialSize));
	const horizontal = position !== "bottom";
	const drag = React.useRef<{ coordinate: number; size: number } | null>(null);
	return (
		<section
			aria-label="Next.js DevTools"
			data-dock={position}
			style={{
				...(horizontal
					? {
							top: "0.5rem",
							bottom: "2.5rem",
							[position]: "0.5rem",
							width: `min(${size}vw, calc(100vw - 1rem))`,
						}
					: {
							left: "0.5rem",
							right: "0.5rem",
							bottom: "2.5rem",
							width: "70%",
							marginInline: "auto",
							height: `min(${size}dvh, calc(100dvh - 3rem))`,
						}),
				minWidth: "min(280px, calc(100vw - 1rem))",
				maxHeight: "calc(100dvh - 3rem)",
				boxShadow: "var(--shadow-lg)",
			}}
			className="devtools-dock devtools:fixed devtools:z-[2147483646] devtools:flex devtools:origin-center devtools:flex-col devtools:overflow-hidden devtools:rounded-lg devtools:border devtools:border-border devtools:bg-background devtools:text-foreground"
		>
			<div
				role="separator"
				tabIndex={0}
				aria-label="Resize DevTools"
				aria-orientation={horizontal ? "vertical" : "horizontal"}
				aria-valuemin={MIN_DOCK_SIZE}
				aria-valuemax={MAX_DOCK_SIZE}
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
					if (event.button !== 0) return;
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
				onPointerCancel={() => {
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
							? MIN_DOCK_SIZE
							: event.key === "End"
								? MAX_DOCK_SIZE
								: clamp(value + (event.key === increase ? 5 : -5)),
					);
				}}
			/>
			{children}
		</section>
	);
}
