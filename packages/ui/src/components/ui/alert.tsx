import * as React from "react";
import { cn } from "../../lib/utils";

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "devtools:bg-card devtools:text-card-foreground devtools:relative devtools:w-full devtools:rounded-lg devtools:border devtools:px-4 devtools:py-3 devtools:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("devtools:font-medium", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("devtools:text-muted-foreground devtools:text-sm", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };