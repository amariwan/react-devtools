import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cn } from "../../lib/utils";

function ToastProvider({ ...props }: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return <ToastPrimitive.Provider data-slot="toast-provider" {...props} />;
}

function Toast({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Root>) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "devtools:bg-background devtools:text-foreground devtools:group devtools:pointer-events-auto devtools:relative devtools:flex devtools:w-full devtools:items-center devtools:justify-between devtools:space-x-4 devtools:overflow-hidden devtools:rounded-md devtools:border devtools:p-6 devtools:pr-8 devtools:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title data-slot="toast-title" className={cn("devtools:text-sm devtools:font-semibold", className)} {...props} />;
}

function ToastDescription({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return <ToastPrimitive.Description data-slot="toast-description" className={cn("devtools:text-sm devtools:text-muted-foreground", className)} {...props} />;
}

function ToastClose({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Close>) {
  return <ToastPrimitive.Close data-slot="toast-close" className={cn("devtools:absolute devtools:top-2 devtools:right-2", className)} {...props} />;
}

function ToastViewport({ className, ...props }: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn("devtools:fixed devtools:top-0 devtools:z-[100] devtools:flex devtools:max-h-screen devtools:w-full devtools:flex-col-reverse devtools:p-4 devtools:sm:bottom-0 devtools:sm:right-0 devtools:sm:top-auto devtools:sm:flex-col", className)}
      {...props}
    />
  );
}

export { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport };