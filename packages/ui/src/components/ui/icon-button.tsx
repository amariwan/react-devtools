"use client";

import type * as React from "react";
import { Button } from "./button.js";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface IconButtonProps extends React.ComponentProps<typeof Button> {
	icon: IconComponent;
	iconClassName?: string;
	/** Accessible name; also used as the native tooltip. */
	label: string;
}

export function IconButton({
	icon: Icon,
	label,
	variant = "ghost",
	size = "icon",
	iconClassName,
	className,
	...props
}: IconButtonProps) {
	return (
		<Button
			variant={variant}
			size={size}
			aria-label={label}
			title={label}
			className={className}
			{...props}
		>
			<Icon aria-hidden className={iconClassName} />
		</Button>
	);
}
