import * as React from "react";
import { cn } from "../../lib/utils";

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="breadcrumb" aria-label="Breadcrumb" className={cn("devtools:text-xs devtools:text-muted-foreground", className)} {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol data-slot="breadcrumb-list" className={cn("devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-1.5", className)} {...props} />;
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="breadcrumb-item" className={cn("devtools:inline-flex devtools:items-center devtools:gap-1.5", className)} {...props} />;
}

function BreadcrumbLink({ className, ...props }: React.ComponentProps<"a">) {
  return <a data-slot="breadcrumb-link" className={cn("devtools:hover:text-foreground", className)} {...props} />;
}

function BreadcrumbSeparator({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="breadcrumb-separator" className={cn("devtools:text-muted-foreground", className)} {...props} />;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" className={cn("devtools:font-medium devtools:text-foreground", className)} {...props} />;
}

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage };