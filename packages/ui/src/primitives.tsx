"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { STATUS_LABELS, statusTone, type StatusTone } from "./status";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const STATUS_DOT_CLASSES: Record<StatusTone, string> = {
  available: "devtools:bg-green-600 devtools:dark:bg-green-500",
  partial: "devtools:bg-amber-600 devtools:dark:bg-amber-500",
  "requires-instrumentation": "devtools:bg-blue-600 devtools:dark:bg-blue-500",
  experimental: "devtools:bg-violet-600 devtools:dark:bg-violet-500",
  unavailable: "devtools:bg-red-600 devtools:dark:bg-red-500",
  error: "devtools:bg-red-600 devtools:dark:bg-red-500",
  diagnostic: "devtools:bg-red-500 devtools:dark:bg-red-500",
};

/* ------------------------------------------------------------------ Badge */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "devtools:inline-flex devtools:items-center devtools:gap-1 devtools:rounded-full devtools:border devtools:px-2 devtools:py-0.5 devtools:text-[11px] devtools:font-medium devtools:leading-none devtools:whitespace-nowrap",
        variant === "default" &&
          "devtools:border-transparent devtools:bg-primary devtools:text-primary-foreground",
        variant === "secondary" &&
          "devtools:border-transparent devtools:bg-muted devtools:text-muted-foreground",
        variant === "outline" &&
          "devtools:border-border devtools:text-muted-foreground",
        variant === "destructive" &&
          "devtools:border-transparent devtools:bg-destructive/10 devtools:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------- StatusDot */

export interface StatusDotProps {
  /** Availability or runtime-status string, e.g. `available` | `error`. */
  status: string;
  label?: string;
  className?: string;
}

export function StatusDot({ status, label, className }: StatusDotProps) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "devtools:inline-flex devtools:items-center devtools:gap-1.5 devtools:text-xs devtools:text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "devtools:size-2 devtools:rounded-full",
          STATUS_DOT_CLASSES[tone],
        )}
      />
      <span>{label ?? STATUS_LABELS[tone]}</span>
    </span>
  );
}

/* ------------------------------------------------------------- EmptyState */

export interface EmptyStateProps {
  icon?: IconComponent;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "devtools:flex devtools:flex-col devtools:items-center devtools:justify-center devtools:gap-2 devtools:px-6 devtools:py-12 devtools:text-center",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className="devtools:size-6 devtools:text-muted-foreground/60"
          aria-hidden
        />
      ) : null}
      <div className="devtools:text-sm devtools:font-medium devtools:text-foreground">
        {title}
      </div>
      {description ? (
        <div className="devtools:max-w-sm devtools:text-xs devtools:text-muted-foreground">
          {description}
        </div>
      ) : null}
      {action ? <div className="devtools:mt-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------- ErrorState */

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "devtools:flex devtools:flex-col devtools:items-center devtools:justify-center devtools:gap-2 devtools:px-6 devtools:py-12 devtools:text-center",
        className,
      )}
    >
      <TriangleAlertIcon
        className="devtools:size-6 devtools:text-destructive"
        aria-hidden
      />
      <div className="devtools:text-sm devtools:font-medium devtools:text-foreground">
        {title}
      </div>
      {message ? (
        <div className="devtools:max-w-sm devtools:text-xs devtools:text-muted-foreground">
          {message}
        </div>
      ) : null}
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="devtools:mt-2"
          onClick={onRetry}
        >
          Retry
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ IconButton */

export interface IconButtonProps extends React.ComponentProps<typeof Button> {
  icon: IconComponent;
  /** Accessible name; also used as the native tooltip. */
  label: string;
}

export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "icon-sm",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      title={label}
      className={className}
      {...props}
    >
      <Icon aria-hidden />
    </Button>
  );
}

/* ----------------------------------------------------------- SearchField */

export interface SearchFieldProps extends Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "value"
> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("devtools:relative", className)}>
      <SearchIcon
        className="devtools:pointer-events-none devtools:absolute devtools:top-1/2 devtools:left-2.5 devtools:size-3.5 devtools:-translate-y-1/2 devtools:text-muted-foreground"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="devtools:pl-8"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="devtools:absolute devtools:top-1/2 devtools:right-1.5 devtools:-translate-y-1/2 devtools:rounded devtools:p-0.5 devtools:text-muted-foreground devtools:hover:text-foreground"
        >
          <XIcon className="devtools:size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- PanelHeader */

export interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "devtools:flex devtools:items-center devtools:gap-2 devtools:border-b devtools:border-border devtools:px-3 devtools:py-2",
        className,
      )}
      {...props}
    >
      <div className="devtools:min-w-0 devtools:flex-1">
        <h2 className="devtools:truncate devtools:text-sm devtools:font-medium devtools:text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="devtools:truncate devtools:text-xs devtools:text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-1">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------- Toolbar */

export function Toolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "devtools:flex devtools:items-center devtools:gap-1 devtools:border-b devtools:border-border devtools:px-2 devtools:py-1",
        className,
      )}
      {...props}
    />
  );
}

/* ----------------------------------------------------------- Breadcrumbs */

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: readonly BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "devtools:flex devtools:items-center devtools:gap-1 devtools:text-xs devtools:text-muted-foreground",
        className,
      )}
    >
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <ChevronRightIcon
              className="devtools:size-3 devtools:text-muted-foreground/60"
              aria-hidden
            />
          ) : null}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="devtools:rounded devtools:hover:text-foreground"
            >
              {item.label}
            </button>
          ) : (
            <span className="devtools:text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* --------------------------------------------------------------- Switch */

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "devtools:inline-flex devtools:h-5 devtools:w-9 devtools:shrink-0 devtools:cursor-pointer devtools:items-center devtools:rounded-full devtools:border devtools:border-transparent devtools:p-0.5 devtools:transition-colors devtools:outline-none devtools:focus-visible:ring-3 devtools:focus-visible:ring-ring/50 devtools:disabled:cursor-not-allowed devtools:disabled:opacity-50",
        checked ? "devtools:bg-primary" : "devtools:bg-input",
        className,
      )}
    >
      <span
        className={cn(
          "devtools:block devtools:size-4 devtools:rounded-full devtools:bg-white devtools:shadow devtools:transition-transform",
          checked ? "devtools:translate-x-4" : "devtools:translate-x-0",
        )}
      />
    </button>
  );
}

/* --------------------------------------------------------------- Select */

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Accessible name. */
  label?: string;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  className,
}: SelectProps) {
  return (
    <div className={cn("devtools:relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="devtools:h-8 devtools:w-full devtools:appearance-none devtools:rounded-lg devtools:border devtools:border-input devtools:bg-transparent devtools:pr-7 devtools:pl-2.5 devtools:text-sm devtools:outline-none devtools:focus-visible:border-ring devtools:focus-visible:ring-3 devtools:focus-visible:ring-ring/50 devtools:dark:bg-input/30"
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

/* ---------------------------------------------------------- SettingsRow */

export interface SettingsRowProps {
  label: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SettingsRow({
  label,
  description,
  children,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "devtools:flex devtools:items-center devtools:justify-between devtools:gap-4 devtools:py-2",
        className,
      )}
    >
      <div className="devtools:min-w-0">
        <div className="devtools:text-sm devtools:text-foreground">{label}</div>
        {description ? (
          <div className="devtools:text-xs devtools:text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      <div className="devtools:flex devtools:shrink-0 devtools:items-center devtools:gap-2">
        {children}
      </div>
    </div>
  );
}
