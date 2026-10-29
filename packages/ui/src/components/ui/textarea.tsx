import * as React from "react";
import { cn } from "../../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "devtools:border-input devtools:placeholder:text-muted-foreground devtools:focus-visible:border-ring devtools:focus-visible:ring-ring/50 devtools:aria-invalid:border-destructive devtools:aria-invalid:ring-destructive/20 devtools:dark:bg-input/30 devtools:flex devtools:min-h-16 devtools:w-full devtools:rounded-md devtools:border devtools:bg-transparent devtools:px-3 devtools:py-2 devtools:text-sm devtools:shadow-xs devtools:transition-[color,box-shadow] devtools:outline-none devtools:focus-visible:ring-[3px] devtools:disabled:cursor-not-allowed devtools:disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };