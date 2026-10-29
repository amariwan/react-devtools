import * as React from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn } from "../../lib/utils";

function Field({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Root>) {
  return <FieldPrimitive.Root data-slot="field" className={cn("devtools:grid devtools:gap-2", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Label>) {
  return <FieldPrimitive.Label data-slot="field-label" className={cn("devtools:text-sm devtools:font-medium", className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Description>) {
  return <FieldPrimitive.Description data-slot="field-description" className={cn("devtools:text-xs devtools:text-muted-foreground", className)} {...props} />;
}

function FieldError({ className, ...props }: React.ComponentProps<typeof FieldPrimitive.Error>) {
  return <FieldPrimitive.Error data-slot="field-error" className={cn("devtools:text-xs devtools:text-destructive", className)} {...props} />;
}

export { Field, FieldLabel, FieldDescription, FieldError };