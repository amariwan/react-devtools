import * as React from "react";
import { cn } from "../../lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "devtools:flex devtools:items-center devtools:gap-2 devtools:text-sm devtools:font-medium devtools:leading-none devtools:select-none devtools:group-data-[disabled=true]:pointer-events-none devtools:group-data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };