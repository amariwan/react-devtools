import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "../../lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "devtools:border-input devtools:dark:bg-input/30 devtools:data-[checked]:bg-primary devtools:data-[checked]:text-primary-foreground devtools:data-[checked]:border-primary devtools:peer devtools:size-4 devtools:shrink-0 devtools:rounded-[4px] devtools:border devtools:shadow-xs devtools:transition-shadow devtools:outline-none devtools:focus-visible:border-ring devtools:focus-visible:ring-[3px] devtools:focus-visible:ring-ring/50 devtools:disabled:cursor-not-allowed devtools:disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="devtools:flex devtools:items-center devtools:justify-center">
        <CheckIcon className="devtools:size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };