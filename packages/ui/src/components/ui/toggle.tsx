import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { cn } from "../../lib/utils";

function Toggle({ className, ...props }: React.ComponentProps<typeof TogglePrimitive>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(
        "devtools:inline-flex devtools:items-center devtools:justify-center devtools:gap-2 devtools:rounded-md devtools:text-sm devtools:font-medium devtools:transition-colors devtools:hover:bg-muted devtools:hover:text-muted-foreground devtools:data-[pressed]:bg-accent devtools:data-[pressed]:text-accent-foreground devtools:disabled:pointer-events-none devtools:disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Toggle };