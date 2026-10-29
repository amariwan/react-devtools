import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange" | "children"> {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Accessible name. */
  label?: string;
  className?: string;
}

function Select({ value, onChange, options, label, className, ...props }: SelectProps) {
  return (
    <div className={cn("devtools:relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label ?? props["aria-label"]}
        {...props}
        className="devtools:h-8 devtools:w-full devtools:appearance-none devtools:rounded-md devtools:border devtools:border-input devtools:bg-transparent devtools:pr-7 devtools:pl-2.5 devtools:text-sm devtools:outline-none devtools:focus-visible:border-ring devtools:focus-visible:ring-3 devtools:focus-visible:ring-ring/50 devtools:dark:bg-input/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className="devtools:pointer-events-none devtools:absolute devtools:top-1/2 devtools:right-2 devtools:size-3.5 devtools:-translate-y-1/2 devtools:text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export { Select };
