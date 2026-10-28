import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "devtools:h-8 devtools:w-full devtools:min-w-0 devtools:rounded-lg devtools:border devtools:border-input devtools:bg-transparent devtools:px-2.5 devtools:py-1 devtools:text-base devtools:transition-colors devtools:outline-none devtools:file:inline-flex devtools:file:h-6 devtools:file:border-0 devtools:file:bg-transparent devtools:file:text-sm devtools:file:font-medium devtools:file:text-foreground devtools:placeholder:text-muted-foreground devtools:focus-visible:border-ring devtools:focus-visible:ring-3 devtools:focus-visible:ring-ring/50 devtools:disabled:pointer-events-none devtools:disabled:cursor-not-allowed devtools:disabled:bg-input/50 devtools:disabled:opacity-50 devtools:aria-invalid:border-destructive devtools:aria-invalid:ring-3 devtools:aria-invalid:ring-destructive/20 devtools:md:text-sm devtools:dark:bg-input/30 devtools:dark:disabled:bg-input/80 devtools:dark:aria-invalid:border-destructive/50 devtools:dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
