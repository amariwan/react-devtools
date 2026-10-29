import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "devtools:animate-pulse devtools:rounded-md devtools:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };