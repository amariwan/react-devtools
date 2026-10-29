import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "../../lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("devtools:flex devtools:flex-col devtools:gap-2", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "devtools:bg-muted devtools:text-muted-foreground devtools:inline-flex devtools:h-9 devtools:w-fit devtools:items-center devtools:justify-center devtools:rounded-lg devtools:p-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "devtools:data-[active]:bg-background devtools:data-[active]:text-foreground devtools:inline-flex devtools:h-[calc(100%-1px)] devtools:flex-1 devtools:items-center devtools:justify-center devtools:gap-1.5 devtools:rounded-md devtools:border devtools:border-transparent devtools:px-2 devtools:py-1 devtools:text-sm devtools:font-medium devtools:whitespace-nowrap devtools:transition-[color,box-shadow] devtools:focus-visible:border-ring devtools:focus-visible:ring-[3px] devtools:focus-visible:ring-ring/50 devtools:disabled:pointer-events-none devtools:disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("devtools:flex-1 devtools:outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };