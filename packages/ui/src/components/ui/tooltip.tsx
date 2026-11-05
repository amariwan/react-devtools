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
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> & {
	sideOffset?: number;
}) {
	return (
		<TooltipPrimitive.Portal container={useDevtoolsPortalContainer()}>
			<TooltipPrimitive.Positioner
				className="devtools:z-[2147483647]"
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
