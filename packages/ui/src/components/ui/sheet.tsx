import { useDevtoolsPortalContainer } from "../portal-container";
import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { cn } from "../../lib/utils";

function Sheet({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <DialogPrimitive.Portal container={useDevtoolsPortalContainer()}>
      <DialogPrimitive.Backdrop className="devtools:fixed devtools:inset-0 devtools:z-[2147483647] devtools:bg-black/40" />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "devtools:bg-background devtools:fixed devtools:z-[2147483647] devtools:flex devtools:flex-col devtools:gap-4 devtools:shadow-lg",
          side === "right" &&
            "devtools:inset-y-0 devtools:right-0 devtools:h-full devtools:w-3/4 devtools:border-l devtools:sm:max-w-sm",
          side === "left" &&
            "devtools:inset-y-0 devtools:left-0 devtools:h-full devtools:w-3/4 devtools:border-r devtools:sm:max-w-sm",
          side === "top" &&
            "devtools:inset-x-0 devtools:top-0 devtools:h-auto devtools:border-b",
          side === "bottom" &&
            "devtools:inset-x-0 devtools:bottom-0 devtools:h-auto devtools:border-t",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="devtools:absolute devtools:top-4 devtools:right-4 devtools:opacity-70 devtools:hover:opacity-100">
          <XIcon className="devtools:size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "devtools:flex devtools:flex-col devtools:gap-1.5",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("devtools:text-lg devtools:font-semibold", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
