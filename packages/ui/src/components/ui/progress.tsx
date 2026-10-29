import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "../../lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "devtools:bg-muted devtools:relative devtools:h-2 devtools:w-full devtools:overflow-hidden devtools:rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="devtools:h-full devtools:w-full">
        <ProgressPrimitive.Indicator
          className="devtools:bg-primary devtools:h-full devtools:transition-all"
          style={{ width: `${value ?? 0}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export { Progress };