"use client";

import { resolveElementSource } from "@next-devtools/source-inspector";
import type { ResolvedElementSource } from "@next-devtools/source-inspector";
import { ChevronUp } from "lucide-react";
import * as React from "react";

export interface PickedElement {
	element: HTMLElement;
	source: Awaited<ReturnType<typeof resolveElementSource>>;
}

export interface ElementPickerProps {
	active: boolean;
	onPick: (
		el: HTMLElement,
		source: Awaited<ReturnType<typeof resolveElementSource>>,
	) => void;
	onCancel: () => void;
}

export function resolveInspectableTarget(
	target: EventTarget | null,
): HTMLElement | null {
	let element: Element | null =
		target instanceof HTMLElement
			? target
			: target instanceof Element
				? target.parentElement
				: null;
	if (!element) return null;
	if (element instanceof SVGElement && element.parentElement) {
		element = element.parentElement;
	}
	if (!(element instanceof HTMLElement)) return null;
	if (element.closest("devtools-root")) return null;
	const root = element.getRootNode();
	if (
		typeof ShadowRoot !== "undefined" &&
		root instanceof ShadowRoot &&
		root.host.matches("devtools-root")
	) {
		return null;
	}
	return element;
}

export function isInspectableTarget(
	target: EventTarget | null,
): target is HTMLElement {
	return resolveInspectableTarget(target) !== null;
}

export function ElementHighlight({ element }: { element: HTMLElement | null }) {
	const [rect, setRect] = React.useState<DOMRect | null>(null);

	React.useEffect(() => {
		if (!element || !element.isConnected) {
			setRect(null);
			return;
		}
		const update = () => setRect(element.getBoundingClientRect());
		update();
		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		return () => {
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
		};
	}, [element]);

	if (!rect) return null;
	return (
		<div
			data-next-devtools-highlight="selected"
			aria-hidden
			className="devtools:fixed devtools:pointer-events-none devtools:border-2 devtools:border-primary devtools:bg-primary/10 devtools:z-[2147483645]"
			style={{
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height,
			}}
		/>
	);
}

interface ParentFrame {
	name: string;
	filePath: string | null;
	lineNumber: number | null;
}

export function ElementPicker({
	active,
	onPick,
	onCancel,
}: ElementPickerProps) {
	const [hover, setHover] = React.useState<HTMLElement | null>(null);
	const hoverRef = React.useRef<HTMLElement | null>(null);
	const [, force] = React.useReducer((x: number) => x + 1, 0);
	const [source, setSource] = React.useState<ResolvedElementSource | null>(
		null,
	);
	const [parents, setParents] = React.useState<ParentFrame[]>([]);
	const [parentIdx, setParentIdx] = React.useState(0);

	React.useEffect(() => {
		if (!active) {
			setHover(null);
			hoverRef.current = null;
			setSource(null);
			setParents([]);
			setParentIdx(0);
			return;
		}

		const onMove = (e: MouseEvent) => {
			const t = resolveInspectableTarget(e.target);
			if (!t) return;
			if (hoverRef.current === t) {
				force();
				return;
			}
			hoverRef.current = t;
			setHover(t);
			void resolveElementSource(t).then((s) => {
				setSource(s);
				setParents(s?.parentComponents ?? []);
				setParentIdx(0);
			});
		};

		const onClick = (e: MouseEvent) => {
			// Isolate the pick from the inspected application: stop the event from
			// reaching React root handlers so the underlying control never fires.
			e.preventDefault();
			e.stopPropagation();
			const t = resolveInspectableTarget(e.target);
			if (!t) return;
			void resolveElementSource(t).then((s) => onPick(t, s));
		};

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};

		const refresh = () => force();
		window.addEventListener("scroll", refresh, true);
		window.addEventListener("resize", refresh);

		document.addEventListener("mousemove", onMove, true);
		document.addEventListener("click", onClick, true);
		document.addEventListener("keydown", onKey, true);
		return () => {
			window.removeEventListener("scroll", refresh, true);
			window.removeEventListener("resize", refresh);
			document.removeEventListener("mousemove", onMove, true);
			document.removeEventListener("click", onClick, true);
			document.removeEventListener("keydown", onKey, true);
		};
	}, [active, onPick, onCancel]);

	if (!active || !hover) return null;
	const rect = hover.getBoundingClientRect();
	const compName = source?.componentName ?? "Unknown";
	const file = source?.filePath ?? null;
	const line = source?.lineNumber ?? null;
	const col = source?.columnNumber ?? null;

	const cycleParent = () => {
		if (parents.length <= 1) return;
		setParentIdx((i) => (i + 1) % parents.length);
	};

	return (
		<>
			<div
				aria-hidden
				className="devtools:fixed devtools:pointer-events-none devtools:border-2 devtools:border-primary devtools:bg-primary/10 devtools:z-[2147483646]"
				style={{
					top: rect.top,
					left: rect.left,
					width: rect.width,
					height: rect.height,
				}}
			/>
			<div
				className="devtools:fixed devtools:pointer-events-auto devtools:z-[2147483647] devtools:max-w-[400px] devtools:rounded-md devtools:border devtools:border-border devtools:bg-popover devtools:px-2.5 devtools:py-1.5 devtools:text-xs devtools:text-popover-foreground devtools:shadow-md"
				style={{
					top: Math.max(8, rect.top - 60),
					left: rect.left,
				}}
			>
				<div className="devtools:font-semibold">{compName}</div>
				{file && (
					<div className="devtools:break-all devtools:text-[11px] devtools:text-muted-foreground">
						{file}
						{line ? `:${line}${col ? `:${col}` : ""}` : ""}
					</div>
				)}
				{parents.length > 1 && (
					<button
						type="button"
						onClick={cycleParent}
						className="devtools:mt-1 devtools:inline-flex devtools:items-center devtools:gap-1 devtools:rounded-sm devtools:border devtools:border-border devtools:bg-secondary devtools:px-1.5 devtools:py-0.5 devtools:text-[10px] devtools:text-secondary-foreground devtools:hover:bg-accent devtools:focus-visible:outline-none devtools:focus-visible:ring-2 devtools:focus-visible:ring-ring"
					>
						<ChevronUp aria-hidden className="devtools:size-3" />
						Parent: {parents[parentIdx]?.name ?? "—"}
					</button>
				)}
			</div>
		</>
	);
}
