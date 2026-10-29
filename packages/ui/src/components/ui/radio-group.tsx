import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { cn } from "../../lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive>) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("devtools:grid devtools:gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof Radio.Root>) {
  return (
    <Radio.Root
      data-slot="radio-group-item"
      className={cn(
        "devtools:border-input devtools:text-primary devtools:aspect-square devtools:size-4 devtools:shrink-0 devtools:rounded-full devtools:border devtools:shadow-xs devtools:transition-shadow devtools:outline-none devtools:focus-visible:border-ring devtools:focus-visible:ring-[3px] devtools:focus-visible:ring-ring/50 devtools:disabled:cursor-not-allowed devtools:disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Radio.Indicator className="devtools:flex devtools:items-center devtools:justify-center">
        <span className="devtools:size-2 devtools:rounded-full devtools:bg-primary" />
      </Radio.Indicator>
    </Radio.Root>
  );
}

export { RadioGroup, RadioGroupItem };