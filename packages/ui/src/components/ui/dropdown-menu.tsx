import { useDevtoolsPortalContainer } from "../portal-container";
import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "../../lib/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup> & { sideOffset?: number }) {
  return (
    <MenuPrimitive.Portal container={useDevtoolsPortalContainer()}>
      <MenuPrimitive.Positioner
        className="devtools:z-[2147483647]"
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "devtools:bg-popover devtools:text-popover-foreground devtools:z-[2147483647] devtools:min-w-[8rem] devtools:overflow-hidden devtools:rounded-md devtools:border devtools:p-1 devtools:shadow-md",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "devtools:focus:bg-accent devtools:focus:text-accent-foreground devtools:relative devtools:flex devtools:cursor-default devtools:items-center devtools:gap-2 devtools:rounded-sm devtools:px-2 devtools:py-1.5 devtools:text-sm devtools:outline-none devtools:select-none",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "devtools:bg-border devtools:-mx-1 devtools:my-1 devtools:h-px",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn(
        "devtools:px-2 devtools:py-1.5 devtools:text-xs devtools:font-medium",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
