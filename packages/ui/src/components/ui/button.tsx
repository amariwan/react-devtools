import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "devtools:group/button devtools:inline-flex devtools:shrink-0 devtools:items-center devtools:justify-center devtools:rounded-md devtools:border devtools:border-transparent devtools:bg-clip-padding devtools:text-sm devtools:font-medium devtools:whitespace-nowrap devtools:transition-colors devtools:duration-150 devtools:motion-reduce:transition-none devtools:outline-none devtools:select-none devtools:focus-visible:border-ring devtools:focus-visible:ring-3 devtools:focus-visible:ring-ring/50 devtools:active:not-aria-[haspopup]:translate-y-px devtools:disabled:pointer-events-none devtools:disabled:opacity-50 devtools:aria-invalid:border-destructive devtools:aria-invalid:ring-3 devtools:aria-invalid:ring-destructive/20 devtools:dark:aria-invalid:border-destructive/50 devtools:dark:aria-invalid:ring-destructive/40 devtools:[&_svg]:pointer-events-none devtools:[&_svg]:shrink-0 devtools:[&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "devtools:bg-primary devtools:text-primary-foreground devtools:hover:bg-primary/80",
        outline:
          "devtools:border-border devtools:bg-background devtools:hover:bg-muted devtools:hover:text-foreground devtools:aria-expanded:bg-muted devtools:aria-expanded:text-foreground devtools:dark:border-input devtools:dark:bg-input/30 devtools:dark:hover:bg-input/50",
        secondary:
          "devtools:bg-secondary devtools:text-secondary-foreground devtools:hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] devtools:aria-expanded:bg-secondary devtools:aria-expanded:text-secondary-foreground",
        ghost:
          "devtools:hover:bg-muted devtools:hover:text-foreground devtools:aria-expanded:bg-muted devtools:aria-expanded:text-foreground devtools:dark:hover:bg-muted/50",
        destructive:
          "devtools:bg-destructive/10 devtools:text-destructive devtools:hover:bg-destructive/20 devtools:focus-visible:border-destructive/40 devtools:focus-visible:ring-destructive/20 devtools:dark:bg-destructive/20 devtools:dark:hover:bg-destructive/30 devtools:dark:focus-visible:ring-destructive/40",
        link: "devtools:text-primary devtools:underline-offset-4 devtools:hover:underline",
      },
      size: {
        default:
          "devtools:h-8 devtools:gap-1.5 devtools:px-2.5 devtools:has-data-[icon=inline-end]:pr-2 devtools:has-data-[icon=inline-start]:pl-2",
        xs: "devtools:h-6 devtools:gap-1 devtools:rounded-[min(var(--radius-md),10px)] devtools:px-2 devtools:text-xs devtools:in-data-[slot=button-group]:rounded-lg devtools:has-data-[icon=inline-end]:pr-1.5 devtools:has-data-[icon=inline-start]:pl-1.5 devtools:[&_svg:not([class*='size-'])]:size-3",
        sm: "devtools:h-7 devtools:gap-1 devtools:rounded-[min(var(--radius-md),12px)] devtools:px-2.5 devtools:text-[0.8rem] devtools:in-data-[slot=button-group]:rounded-lg devtools:has-data-[icon=inline-end]:pr-1.5 devtools:has-data-[icon=inline-start]:pl-1.5 devtools:[&_svg:not([class*='size-'])]:size-3.5",
        lg: "devtools:h-9 devtools:gap-1.5 devtools:px-2.5 devtools:has-data-[icon=inline-end]:pr-2 devtools:has-data-[icon=inline-start]:pl-2",
        icon: "devtools:size-8",
        "icon-xs":
          "devtools:size-6 devtools:rounded-[min(var(--radius-md),10px)] devtools:in-data-[slot=button-group]:rounded-lg devtools:[&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "devtools:size-7 devtools:rounded-[min(var(--radius-md),12px)] devtools:in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "devtools:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
