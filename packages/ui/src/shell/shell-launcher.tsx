"use client";

import { Code2, CrosshairIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils.js";

const DOCK_INACTIVE_TIMEOUT_MS = 3_000;

export function DevtoolsLauncher({
	onOpen,
	onPick,
	expanded: forcedExpanded,
}: {
	onOpen: () => void;
	onPick: () => void;
	expanded?: boolean;
}) {
	const [pointerActive, setPointerActive] = React.useState(false);
	const [touchDevice, setTouchDevice] = React.useState(false);
	const [focusWithin, setFocusWithin] = React.useState(false);
	const collapseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const gradientId = React.useId().replaceAll(":", "");
	const expanded =
		forcedExpanded || pointerActive || touchDevice || focusWithin;
	const minimized = !expanded;

	React.useEffect(() => {
		setTouchDevice(
			"ontouchstart" in window ||
				navigator.maxTouchPoints > 0 ||
				("msMaxTouchPoints" in navigator &&
					Number(
						(navigator as Navigator & { msMaxTouchPoints: number })
							.msMaxTouchPoints,
					) > 0),
		);

		return () => {
			if (collapseTimer.current) clearTimeout(collapseTimer.current);
		};
	}, []);

	const bringUp = () => {
		setPointerActive(true);
		if (collapseTimer.current) clearTimeout(collapseTimer.current);
		collapseTimer.current = setTimeout(() => {
			setPointerActive(false);
			collapseTimer.current = null;
		}, DOCK_INACTIVE_TIMEOUT_MS);
	};

	const activateFromKeyboard = (
		event: React.KeyboardEvent<HTMLButtonElement>,
	) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onOpen();
		}
	};

	return (
		<div
			role="group"
			aria-label="Next.js DevTools dock"
			data-minimized={minimized}
			className={cn(
				"devtools:group devtools:fixed devtools:bottom-3.5 devtools:left-1/2 devtools:z-[2147483647] devtools:isolate devtools:flex devtools:-translate-x-1/2 devtools:items-center devtools:justify-center devtools:border devtools:border-[#8882] devtools:bg-white/78 devtools:text-neutral-800 devtools:shadow devtools:backdrop-blur-[28px] devtools:transition-all devtools:duration-500 devtools:ease-[cubic-bezier(0.16,1,0.3,1)] devtools:dark:bg-[#111]/78 devtools:dark:text-neutral-200 devtools:motion-reduce:transition-none",
				minimized
					? "devtools:h-[22px] devtools:w-[22px] devtools:rounded-full devtools:p-0"
					: "devtools:h-10 devtools:w-max devtools:rounded-lg",
			)}
			onPointerEnter={(event) => {
				if (event.pointerType !== "touch") bringUp();
			}}
			onPointerMove={(event) => {
				if (event.pointerType !== "touch") bringUp();
			}}
			onFocusCapture={() => setFocusWithin(true)}
			onBlurCapture={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					setFocusWithin(false);
				}
			}}
		>
			<div
				aria-hidden="true"
				className="devtools:pointer-events-none devtools:absolute devtools:left-1/2 devtools:top-1/2 devtools:z-0 devtools:size-40 devtools:-translate-x-1/2 devtools:-translate-y-1/2 devtools:rounded-full devtools:bg-[linear-gradient(45deg,#adc77f,#517158,#486954)] devtools:opacity-0 devtools:blur-[60px] devtools:transition-opacity devtools:duration-1000 devtools:ease-out devtools:group-hover:opacity-60"
			/>
			<button
				type="button"
				aria-label="Open Next.js DevTools (collapsed)"
				tabIndex={minimized ? 0 : -1}
				aria-hidden={!minimized}
				onPointerDown={onOpen}
				onKeyDown={activateFromKeyboard}
				className={cn(
					"devtools:absolute devtools:left-1/2 devtools:top-1/2 devtools:z-10 devtools:flex devtools:size-3 devtools:-translate-x-1/2 devtools:-translate-y-1/2 devtools:items-center devtools:justify-center devtools:border-0 devtools:bg-transparent devtools:p-0 devtools:transition-opacity devtools:duration-300 devtools:outline-none",
					minimized
						? "devtools:opacity-100"
						: "devtools:pointer-events-none devtools:opacity-0",
				)}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 500 500"
					fill="none"
					className="devtools:size-full"
				>
					<path
						d="M238.464 40H66V236.007H104.577C220.688 236.007 232.79 158.437 232.79 121.733C232.79 108.867 243.38 108.867 243.38 121.733C251.318 236.701 356.35 245.457 365.527 246.223L365.542 246.224C374.619 246.981 382.561 251.521 365.542 254.548C253.592 264.765 243.758 364.282 243.38 375.634C243.002 386.986 235.438 399.851 232.79 375.634C222.957 274.603 144.289 257.954 104.577 257.954H66V460.772H238.464C358.356 460.772 452.152 371.472 452.152 251.521C452.152 131.571 356.465 40 238.464 40Z"
						fill={`url(#${gradientId})`}
						stroke="#86997F"
						strokeOpacity="0.5"
						strokeWidth="1.33156"
					/>
					<defs>
						<radialGradient
							id={gradientId}
							cx="0"
							cy="0"
							r="1"
							gradientTransform="matrix(399.011 555.102 -568.423 408.982 -11.6221 -34.9218)"
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#ADC77F" />
							<stop offset="0.71903" stopColor="#517158" />
							<stop offset="1" stopColor="#486954" />
						</radialGradient>
					</defs>
				</svg>
			</button>
			<div
				aria-hidden={minimized}
				className={cn(
					"devtools:relative devtools:z-10 devtools:flex devtools:h-full devtools:w-full devtools:items-center devtools:justify-center devtools:overflow-hidden devtools:px-1 devtools:transition-opacity devtools:duration-200",
					minimized
						? "devtools:pointer-events-none devtools:opacity-0"
						: "devtools:opacity-100",
				)}
			>
				<button
					type="button"
					aria-label="Open Next.js DevTools"
					tabIndex={minimized ? -1 : 0}
					onPointerDown={onOpen}
					onKeyDown={activateFromKeyboard}
					className="devtools:flex devtools:size-8 devtools:shrink-0 devtools:items-center devtools:justify-center devtools:rounded-xl devtools:border-0 devtools:bg-transparent devtools:p-1.5 devtools:text-[#333] devtools:outline-none devtools:transition-all devtools:duration-300 devtools:hover:scale-110 devtools:hover:bg-[#8881] devtools:dark:text-white"
				>
					<Code2 aria-hidden className="devtools:size-5 devtools:shrink-0" />
				</button>
				<button
					type="button"
					aria-label="Pick element"
					tabIndex={minimized ? -1 : 0}
					onClick={onPick}
					className="devtools:flex devtools:size-8 devtools:shrink-0 devtools:items-center devtools:justify-center devtools:rounded-xl devtools:border-0 devtools:bg-transparent devtools:p-1.5 devtools:text-[#333] devtools:outline-none devtools:transition-all devtools:duration-300 devtools:hover:scale-110 devtools:hover:bg-[#8881] devtools:dark:text-white"
				>
					<CrosshairIcon
						aria-hidden
						className="devtools:size-5 devtools:shrink-0"
					/>
				</button>
			</div>
		</div>
	);
}
