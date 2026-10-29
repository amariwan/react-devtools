import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { SearchIcon } from "lucide-react";
import { cn } from "../../lib/utils";

function Command({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="command"
      className={cn("devtools:bg-popover devtools:text-popover-foreground devtools:flex devtools:h-full devtools:w-full devtools:flex-col devtools:overflow-hidden devtools:rounded-md", className)}
      {...props}
    />
  );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof ComboboxPrimitive.Input>) {
  return (
    <div className="devtools:flex devtools:items-center devtools:border-b devtools:px-3">
      <SearchIcon className="devtools:mr-2 devtools:size-4 devtools:shrink-0 devtools:opacity-50" />
      <ComboboxPrimitive.Input
        data-slot="command-input"
        className={cn(
          "devtools:placeholder:text-muted-foreground devtools:flex devtools:h-10 devtools:w-full devtools:rounded-md devtools:bg-transparent devtools:py-3 devtools:text-sm devtools:outline-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command-list" className={cn("devtools:max-h-[300px] devtools:overflow-y-auto devtools:overflow-x-hidden", className)} {...props} />;
}

function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command-empty" className={cn("devtools:py-6 devtools:text-center devtools:text-sm", className)} {...props} />;
}

function CommandGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command-group" className={cn("devtools:overflow-hidden devtools:p-1 devtools:text-foreground", className)} {...props} />;
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof ComboboxPrimitive.Item>) {
  return (
    <ComboboxPrimitive.Item
      data-slot="command-item"
      className={cn(
        "devtools:data-[highlighted]:bg-accent devtools:data-[highlighted]:text-accent-foreground devtools:relative devtools:flex devtools:cursor-default devtools:items-center devtools:gap-2 devtools:rounded-sm devtools:px-2 devtools:py-1.5 devtools:text-sm devtools:outline-none devtools:select-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="command-separator" className={cn("devtools:bg-border devtools:-mx-1 devtools:h-px", className)} {...props} />;
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator };