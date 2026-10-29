import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "../../lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "devtools:bg-border devtools:shrink-0",
        orientation === "horizontal"
          ? "devtools:h-px devtools:w-full"
          : "devtools:h-full devtools:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };