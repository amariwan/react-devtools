import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "../../lib/utils";

function ScrollArea({ className, children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("devtools:relative devtools:overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="devtools:size-full devtools:rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="devtools:flex devtools:touch-none devtools:select-none devtools:transition-colors"
      >
        <ScrollAreaPrimitive.Thumb className="devtools:bg-border devtools:relative devtools:flex-1 devtools:rounded-full" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

export { ScrollArea };