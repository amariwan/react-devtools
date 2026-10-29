import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "../../lib/utils";

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("devtools:relative devtools:flex devtools:w-full devtools:items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="devtools:bg-muted devtools:relative devtools:h-1.5 devtools:w-full devtools:grow devtools:overflow-hidden devtools:rounded-full">
        <SliderPrimitive.Indicator className="devtools:bg-primary devtools:absolute devtools:h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="devtools:border-primary devtools:bg-background devtools:block devtools:size-4 devtools:rounded-full devtools:border devtools:shadow-sm devtools:transition-colors" />
    </SliderPrimitive.Root>
  );
}

export { Slider };