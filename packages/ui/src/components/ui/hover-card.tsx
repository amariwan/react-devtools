import { useDevtoolsPortalContainer } from "../portal-container";
import * as React from "react";
import { PreviewCard as HoverCardPrimitive } from "@base-ui/react/preview-card";
import { cn } from "../../lib/utils";

function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}

function HoverCardContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Popup> & {
  sideOffset?: number;
}) {
  return (
    <HoverCardPrimitive.Portal container={useDevtoolsPortalContainer()}>
      <HoverCardPrimitive.Positioner
        className="devtools:z-[2147483647]"
        sideOffset={sideOffset}
      >
        <HoverCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "devtools:bg-popover devtools:text-popover-foreground devtools:z-[2147483647] devtools:w-64 devtools:rounded-md devtools:border devtools:p-4 devtools:shadow-md devtools:outline-none",
            className,
          )}
          {...props}
        />
      </HoverCardPrimitive.Positioner>
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
