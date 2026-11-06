import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import type * as React from "react";
import { cn } from "../../lib/utils";
import { useDevtoolsPortalContainer } from "../portal-container";

function TooltipProvider({
	delayDuration = 0,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider> & {
	delayDuration?: number;
}) {
	return <TooltipPrimitive.Provider delay={delayDuration} {...props} />;
}

function Tooltip({
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
	className,
	sideOffset = 4,
	side,
	align,
	alignOffset,
	hidden,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> & {
	sideOffset?: number;
	side?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["side"];
	align?: React.ComponentProps<typeof TooltipPrimitive.Positioner>["align"];
	alignOffset?: number;
	hidden?: boolean;
}) {
	const container = useDevtoolsPortalContainer();

	if (hidden) return null;

	return (
		<TooltipPrimitive.Portal container={container}>
			<TooltipPrimitive.Positioner
				className="devtools:z-[2147483647]"
				side={side}
				align={align}
				alignOffset={alignOffset}
				sideOffset={sideOffset}
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					className={cn(
						"devtools:bg-primary devtools:text-primary-foreground devtools:z-[2147483647] devtools:overflow-hidden devtools:rounded-md devtools:px-3 devtools:py-1.5 devtools:text-xs devtools:shadow-md",
						className,
					)}
					{...props}
				/>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	);
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
