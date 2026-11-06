"use client";

import { TriangleAlertIcon } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/button.js";

export interface ErrorStateProps {
	title?: string;
	message?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorState({
	title = "Something went wrong",
	message,
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div
			role="alert"
			className={cn(
				"devtools:flex devtools:flex-col devtools:items-center devtools:justify-center devtools:gap-3 devtools:px-6 devtools:py-8 devtools:text-center",
				className,
			)}
		>
			<span
				aria-hidden
				className="devtools:flex devtools:size-10 devtools:items-center devtools:justify-center devtools:rounded-full devtools:bg-destructive/10 devtools:text-destructive"
			>
				<TriangleAlertIcon className="devtools:size-5" />
			</span>
			<div className="devtools:text-sm devtools:font-semibold devtools:tracking-tight devtools:text-foreground">
				{title}
			</div>
			{message ? (
				<div className="devtools:max-w-xs devtools:text-xs devtools:leading-relaxed devtools:text-muted-foreground">
					{message}
				</div>
			) : null}
			{onRetry ? (
				<Button
					variant="outline"
					size="sm"
					className="devtools:mt-1"
					onClick={onRetry}
				>
					Retry
				</Button>
			) : null}
		</div>
	);
}
