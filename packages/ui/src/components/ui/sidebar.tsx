"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

import { useIsMobile } from "../../hooks/use-mobile";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "./tooltip";
import { PanelLeftIcon } from "lucide-react";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
	state: "expanded" | "collapsed";
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider.");
	}

	return context;
}

function SidebarProvider({
	defaultOpen = true,
	open: openProp,
	onOpenChange: setOpenProp,
	contained = false,
	className,
	style,
	children,
	...props
}: React.ComponentProps<"div"> & {
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Render inline inside a bounded surface instead of the host page. */
	contained?: boolean;
}) {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = React.useState(false);

	const [_open, _setOpen] = React.useState(defaultOpen);
	const open = openProp ?? _open;
	const setOpen = React.useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === "function" ? value(open) : value;
			if (setOpenProp) {
				setOpenProp(openState);
			} else {
				_setOpen(openState);
			}
		},
		[setOpenProp, open],
	);

	const toggleSidebar = React.useCallback(() => {
		if (!contained && isMobile) {
			setOpenMobile((open) => !open);
			return;
		}
		setOpen((open) => !open);
	}, [contained, isMobile, setOpen, setOpenMobile]);

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
				(event.metaKey || event.ctrlKey)
			) {
				event.preventDefault();
				toggleSidebar();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [toggleSidebar]);

	const state = open ? "expanded" : "collapsed";

	const contextValue = React.useMemo<SidebarContextProps>(
		() => ({
			state,
			open,
			setOpen,
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		}),
		[state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<div
				data-slot="sidebar-wrapper"
				style={
					{
						"--sidebar-width": SIDEBAR_WIDTH,
						"--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
						...style,
					} as React.CSSProperties
				}
				className={cn(
					"devtools:group/sidebar-wrapper devtools:flex devtools:w-full",
					contained
						? "devtools:h-full devtools:min-h-0"
						: "devtools:min-h-svh devtools:has-data-[variant=inset]:bg-sidebar",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

function Sidebar({
	side = "left",
	variant = "sidebar",
	collapsible = "offcanvas",
	contained = false,
	className,
	children,
	dir,
	...props
}: React.ComponentProps<"div"> & {
	side?: "left" | "right";
	variant?: "sidebar" | "floating" | "inset";
	collapsible?: "offcanvas" | "icon" | "none";
	/** Render inline inside a bounded surface instead of the host page. */
	contained?: boolean;
}) {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

	if (contained) {
		return (
			<div
				data-slot="sidebar"
				data-state={state}
				data-collapsible={state === "collapsed" ? collapsible : ""}
				data-variant={variant}
				data-side={side}
				className={cn(
					"devtools:group devtools:relative devtools:flex devtools:h-full devtools:shrink-0 devtools:flex-col devtools:overflow-hidden devtools:bg-sidebar devtools:text-sidebar-foreground devtools:transition-[width] devtools:duration-200 devtools:ease-linear",
					collapsible === "icon"
						? state === "collapsed"
							? "devtools:w-(--sidebar-width-icon)"
							: "devtools:w-(--sidebar-width)"
						: "devtools:w-(--sidebar-width)",
					side === "left"
						? "devtools:border-r"
						: "devtools:border-l",
					"devtools:border-sidebar-border",
					className,
				)}
				{...props}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="devtools:flex devtools:size-full devtools:flex-col devtools:bg-sidebar"
				>
					{children}
				</div>
			</div>
		);
	}

	if (collapsible === "none") {
		return (
			<div
				data-slot="sidebar"
				className={cn(
					"devtools:flex devtools:h-full devtools:w-(--sidebar-width) devtools:flex-col devtools:bg-sidebar devtools:text-sidebar-foreground",
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	}

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
				<SheetContent
					dir={dir}
					data-sidebar="sidebar"
					data-slot="sidebar"
					data-mobile="true"
					className="devtools:w-(--sidebar-width) devtools:bg-sidebar devtools:p-0 devtools:text-sidebar-foreground devtools:[&>button]:hidden"
					style={
						{
							"--sidebar-width": SIDEBAR_WIDTH_MOBILE,
						} as React.CSSProperties
					}
					side={side}
				>
					<SheetHeader className="devtools:sr-only">
						<SheetTitle>Sidebar</SheetTitle>
						<SheetDescription>Displays the mobile sidebar.</SheetDescription>
					</SheetHeader>
					<div className="devtools:flex devtools:h-full devtools:w-full devtools:flex-col">
						{children}
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			className="devtools:group devtools:peer devtools:hidden devtools:text-sidebar-foreground devtools:md:block"
			data-state={state}
			data-collapsible={state === "collapsed" ? collapsible : ""}
			data-variant={variant}
			data-side={side}
			data-slot="sidebar"
		>
			<div
				data-slot="sidebar-gap"
				className={cn(
					"devtools:relative devtools:w-(--sidebar-width) devtools:bg-transparent devtools:transition-[width] devtools:duration-200 devtools:ease-linear",
					"devtools:group-data-[collapsible=offcanvas]:w-0",
					"devtools:group-data-[side=right]:rotate-180",
					variant === "floating" || variant === "inset"
						? "devtools:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
						: "devtools:group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
				)}
			/>
			<div
				data-slot="sidebar-container"
				data-side={side}
				className={cn(
					"devtools:fixed devtools:inset-y-0 devtools:z-10 devtools:hidden devtools:h-svh devtools:w-(--sidebar-width) devtools:transition-[left,right,width] devtools:duration-200 devtools:ease-linear devtools:data-[side=left]:left-0 devtools:data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] devtools:data-[side=right]:right-0 devtools:data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] devtools:md:flex",
					variant === "floating" || variant === "inset"
						? "devtools:p-2 devtools:group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
						: "devtools:group-data-[collapsible=icon]:w-(--sidebar-width-icon) devtools:group-data-[side=left]:border-r devtools:group-data-[side=right]:border-l",
					className,
				)}
				{...props}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="devtools:flex devtools:size-full devtools:flex-col devtools:bg-sidebar devtools:group-data-[variant=floating]:rounded-lg devtools:group-data-[variant=floating]:shadow-sm devtools:group-data-[variant=floating]:ring-1 devtools:group-data-[variant=floating]:ring-sidebar-border"
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function SidebarTrigger({
	className,
	onClick,
	...props
}: React.ComponentProps<typeof Button>) {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon-sm"
			className={cn(className)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeftIcon />
			<span className="devtools:sr-only">Toggle Sidebar</span>
		</Button>
	);
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
	const { toggleSidebar } = useSidebar();

	return (
		<button
			data-sidebar="rail"
			data-slot="sidebar-rail"
			aria-label="Toggle Sidebar"
			tabIndex={-1}
			onClick={toggleSidebar}
			title="Toggle Sidebar"
			className={cn(
				"devtools:absolute devtools:inset-y-0 devtools:z-20 devtools:hidden devtools:w-4 devtools:transition-all devtools:ease-linear devtools:group-data-[side=left]:-right-4 devtools:group-data-[side=right]:left-0 devtools:after:absolute devtools:after:inset-y-0 devtools:after:start-1/2 devtools:after:w-[2px] devtools:hover:after:bg-sidebar-border devtools:sm:flex devtools:ltr:-translate-x-1/2 devtools:rtl:-translate-x-1/2",
				"devtools:in-data-[side=left]:cursor-w-resize devtools:in-data-[side=right]:cursor-e-resize",
				"devtools:[[data-side=left][data-state=collapsed]_&]:cursor-e-resize devtools:[[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
				"devtools:group-data-[collapsible=offcanvas]:translate-x-0 devtools:group-data-[collapsible=offcanvas]:after:left-full devtools:hover:group-data-[collapsible=offcanvas]:bg-sidebar",
				"devtools:[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
				"devtools:[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				"devtools:relative devtools:flex devtools:w-full devtools:flex-1 devtools:flex-col devtools:bg-background devtools:md:peer-data-[variant=inset]:m-2 devtools:md:peer-data-[variant=inset]:ml-0 devtools:md:peer-data-[variant=inset]:rounded-xl devtools:md:peer-data-[variant=inset]:shadow-sm devtools:md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarInput({
	className,
	...props
}: React.ComponentProps<typeof Input>) {
	return (
		<Input
			data-slot="sidebar-input"
			data-sidebar="input"
			className={cn("devtools:h-8 devtools:w-full devtools:bg-background devtools:shadow-none", className)}
			{...props}
		/>
	);
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn("devtools:flex devtools:flex-col devtools:gap-2 devtools:p-2", className)}
			{...props}
		/>
	);
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn("devtools:flex devtools:flex-col devtools:gap-2 devtools:p-2", className)}
			{...props}
		/>
	);
}

function SidebarSeparator({
	className,
	...props
}: React.ComponentProps<typeof Separator>) {
	return (
		<Separator
			data-slot="sidebar-separator"
			data-sidebar="separator"
			className={cn("devtools:mx-2 devtools:w-auto devtools:bg-sidebar-border", className)}
			{...props}
		/>
	);
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				"devtools:no-scrollbar devtools:flex devtools:min-h-0 devtools:flex-1 devtools:flex-col devtools:gap-0 devtools:overflow-auto devtools:group-data-[collapsible=icon]:overflow-hidden",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn("devtools:relative devtools:flex devtools:w-full devtools:min-w-0 devtools:flex-col devtools:p-2", className)}
			{...props}
		/>
	);
}

function SidebarGroupLabel({
	className,
	render,
	...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
	return useRender({
		defaultTagName: "div",
		props: mergeProps<"div">(
			{
				className: cn(
					"devtools:flex devtools:h-8 devtools:shrink-0 devtools:items-center devtools:rounded-md devtools:px-2 devtools:text-xs devtools:font-medium devtools:text-sidebar-foreground/70 devtools:ring-sidebar-ring devtools:outline-hidden devtools:transition-[margin,opacity] devtools:duration-200 devtools:ease-linear devtools:group-data-[collapsible=icon]:-mt-8 devtools:group-data-[collapsible=icon]:opacity-0 devtools:focus-visible:ring-2 devtools:[&>svg]:size-4 devtools:[&>svg]:shrink-0",
					className,
				),
			},
			props,
		),
		render,
		state: {
			slot: "sidebar-group-label",
			sidebar: "group-label",
		},
	});
}

function SidebarGroupAction({
	className,
	render,
	...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
	return useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(
					"devtools:absolute devtools:top-3.5 devtools:right-3 devtools:flex devtools:aspect-square devtools:w-5 devtools:items-center devtools:justify-center devtools:rounded-md devtools:p-0 devtools:text-sidebar-foreground devtools:ring-sidebar-ring devtools:outline-hidden devtools:transition-transform devtools:group-data-[collapsible=icon]:hidden devtools:after:absolute devtools:after:-inset-2 devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:md:after:hidden devtools:[&>svg]:size-4 devtools:[&>svg]:shrink-0",
					className,
				),
			},
			props,
		),
		render,
		state: {
			slot: "sidebar-group-action",
			sidebar: "group-action",
		},
	});
}

function SidebarGroupContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn("devtools:w-full devtools:text-sm", className)}
			{...props}
		/>
	);
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn("devtools:flex devtools:w-full devtools:min-w-0 devtools:flex-col devtools:gap-0", className)}
			{...props}
		/>
	);
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn("devtools:group/menu-item devtools:relative", className)}
			{...props}
		/>
	);
}

const sidebarMenuButtonVariants = cva(
	"devtools:peer/menu-button devtools:group/menu-button devtools:flex devtools:w-full devtools:items-center devtools:gap-2 devtools:overflow-hidden devtools:rounded-md devtools:p-2 devtools:text-left devtools:text-sm devtools:ring-sidebar-ring devtools:outline-hidden devtools:transition-[width,height,padding] devtools:group-has-data-[sidebar=menu-action]/menu-item:pr-8 devtools:group-data-[collapsible=icon]:size-8! devtools:group-data-[collapsible=icon]:p-2! devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:active:bg-sidebar-accent devtools:active:text-sidebar-accent-foreground devtools:disabled:pointer-events-none devtools:disabled:opacity-50 devtools:aria-disabled:pointer-events-none devtools:aria-disabled:opacity-50 devtools:data-open:hover:bg-sidebar-accent devtools:data-open:hover:text-sidebar-accent-foreground devtools:data-active:bg-sidebar-accent devtools:data-active:font-medium devtools:data-active:text-sidebar-accent-foreground devtools:[&_svg]:size-4 devtools:[&_svg]:shrink-0 devtools:[&>span:last-child]:truncate",
	{
		variants: {
			variant: {
				default: "devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground",
				outline:
					"devtools:bg-background devtools:shadow-[0_0_0_1px_var(--sidebar-border)] devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
			},
			size: {
				default: "devtools:h-8 devtools:text-sm",
				sm: "devtools:h-7 devtools:text-xs",
				lg: "devtools:h-12 devtools:text-sm devtools:group-data-[collapsible=icon]:p-0!",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function SidebarMenuButton({
	render,
	isActive = false,
	variant = "default",
	size = "default",
	tooltip,
	className,
	...props
}: useRender.ComponentProps<"button"> &
	React.ComponentProps<"button"> & {
		isActive?: boolean;
		tooltip?: string | React.ComponentProps<typeof TooltipContent>;
	} & VariantProps<typeof sidebarMenuButtonVariants>) {
	const { isMobile, state } = useSidebar();
	const comp = useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(sidebarMenuButtonVariants({ variant, size }), className),
			},
			props,
		),
		render: !tooltip ? render : <TooltipTrigger render={render} />,
		state: {
			slot: "sidebar-menu-button",
			sidebar: "menu-button",
			size,
			active: isActive,
		},
	});

	if (!tooltip) {
		return comp;
	}

	if (typeof tooltip === "string") {
		tooltip = {
			children: tooltip,
		};
	}

	return (
		<Tooltip>
			{comp}
			<TooltipContent
				side="right"
				align="center"
				hidden={state !== "collapsed" || isMobile}
				{...tooltip}
			/>
		</Tooltip>
	);
}

function SidebarMenuAction({
	className,
	render,
	showOnHover = false,
	...props
}: useRender.ComponentProps<"button"> &
	React.ComponentProps<"button"> & {
		showOnHover?: boolean;
	}) {
	return useRender({
		defaultTagName: "button",
		props: mergeProps<"button">(
			{
				className: cn(
					"devtools:absolute devtools:top-1.5 devtools:right-1 devtools:flex devtools:aspect-square devtools:w-5 devtools:items-center devtools:justify-center devtools:rounded-md devtools:p-0 devtools:text-sidebar-foreground devtools:ring-sidebar-ring devtools:outline-hidden devtools:transition-transform devtools:group-data-[collapsible=icon]:hidden devtools:peer-hover/menu-button:text-sidebar-accent-foreground devtools:peer-data-[size=default]/menu-button:top-1.5 devtools:peer-data-[size=lg]/menu-button:top-2.5 devtools:peer-data-[size=sm]/menu-button:top-1 devtools:after:absolute devtools:after:-inset-2 devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:md:after:hidden devtools:[&>svg]:size-4 devtools:[&>svg]:shrink-0",
					showOnHover &&
						"devtools:group-focus-within/menu-item:opacity-100 devtools:group-hover/menu-item:opacity-100 devtools:peer-data-active/menu-button:text-sidebar-accent-foreground devtools:aria-expanded:opacity-100 devtools:md:opacity-0",
					className,
				),
			},
			props,
		),
		render,
		state: {
			slot: "sidebar-menu-action",
			sidebar: "menu-action",
		},
	});
}

function SidebarMenuBadge({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-menu-badge"
			data-sidebar="menu-badge"
			className={cn(
				"devtools:pointer-events-none devtools:absolute devtools:right-1 devtools:flex devtools:h-5 devtools:min-w-5 devtools:items-center devtools:justify-center devtools:rounded-md devtools:px-1 devtools:text-xs devtools:font-medium devtools:text-sidebar-foreground devtools:tabular-nums devtools:select-none devtools:group-data-[collapsible=icon]:hidden devtools:peer-hover/menu-button:text-sidebar-accent-foreground devtools:peer-data-[size=default]/menu-button:top-1.5 devtools:peer-data-[size=lg]/menu-button:top-2.5 devtools:peer-data-[size=sm]/menu-button:top-1 devtools:peer-data-active/menu-button:text-sidebar-accent-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarMenuSkeleton({
	className,
	showIcon = false,
	...props
}: React.ComponentProps<"div"> & {
	showIcon?: boolean;
}) {
	const [width] = React.useState(() => {
		return `${Math.floor(Math.random() * 40) + 50}%`;
	});

	return (
		<div
			data-slot="sidebar-menu-skeleton"
			data-sidebar="menu-skeleton"
			className={cn("devtools:flex devtools:h-8 devtools:items-center devtools:gap-2 devtools:rounded-md devtools:px-2", className)}
			{...props}
		>
			{showIcon && (
				<Skeleton
					className="devtools:size-4 devtools:rounded-md"
					data-sidebar="menu-skeleton-icon"
				/>
			)}
			<Skeleton
				className="devtools:h-4 devtools:max-w-(--skeleton-width) devtools:flex-1"
				data-sidebar="menu-skeleton-text"
				style={
					{
						"--skeleton-width": width,
					} as React.CSSProperties
				}
			/>
		</div>
	);
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn(
				"devtools:mx-3.5 devtools:flex devtools:min-w-0 devtools:translate-x-px devtools:flex-col devtools:gap-1 devtools:border-l devtools:border-sidebar-border devtools:px-2.5 devtools:py-0.5 devtools:group-data-[collapsible=icon]:hidden",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarMenuSubItem({
	className,
	...props
}: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="sidebar-menu-sub-item"
			data-sidebar="menu-sub-item"
			className={cn("devtools:group/menu-sub-item devtools:relative", className)}
			{...props}
		/>
	);
}

function SidebarMenuSubButton({
	render,
	size = "md",
	isActive = false,
	className,
	...props
}: useRender.ComponentProps<"a"> &
	React.ComponentProps<"a"> & {
		size?: "sm" | "md";
		isActive?: boolean;
	}) {
	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				className: cn(
					"devtools:flex devtools:h-7 devtools:min-w-0 devtools:-translate-x-px devtools:items-center devtools:gap-2 devtools:overflow-hidden devtools:rounded-md devtools:px-2 devtools:text-sidebar-foreground devtools:ring-sidebar-ring devtools:outline-hidden devtools:group-data-[collapsible=icon]:hidden devtools:hover:bg-sidebar-accent devtools:hover:text-sidebar-accent-foreground devtools:focus-visible:ring-2 devtools:active:bg-sidebar-accent devtools:active:text-sidebar-accent-foreground devtools:disabled:pointer-events-none devtools:disabled:opacity-50 devtools:aria-disabled:pointer-events-none devtools:aria-disabled:opacity-50 devtools:data-[size=md]:text-sm devtools:data-[size=sm]:text-xs devtools:data-active:bg-sidebar-accent devtools:data-active:text-sidebar-accent-foreground devtools:[&>span:last-child]:truncate devtools:[&>svg]:size-4 devtools:[&>svg]:shrink-0 devtools:[&>svg]:text-sidebar-accent-foreground",
					className,
				),
			},
			props,
		),
		render,
		state: {
			slot: "sidebar-menu-sub-button",
			sidebar: "menu-sub-button",
			size,
			active: isActive,
		},
	});
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInput,
	SidebarInset,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
	useSidebar,
};
