export function KeyboardShortcuts({ isMac }: { isMac: boolean }) {
	return (
		<div className="devtools:flex devtools:flex-col devtools:items-center devtools:gap-1 devtools:text-xs devtools:text-muted-foreground">
			<div className="devtools:flex devtools:items-center devtools:gap-1.5">
				<span className="devtools:opacity-60">Press</span>
				<kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
					{isMac ? "⌘ Command" : "Ctrl"}
				</kbd>
				<span className="devtools:opacity-60">+</span>
				<kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
					K
				</kbd>
				<span className="devtools:opacity-60">to toggle Command Palette</span>
			</div>
			<div className="devtools:flex devtools:items-center devtools:gap-1.5">
				<span className="devtools:opacity-60">Press</span>
				<kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
					{isMac ? "⇧ Shift" : "Shift"}
				</kbd>
				<span className="devtools:opacity-60">+</span>
				<kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
					{isMac ? "⌥ Option" : "Alt"}
				</kbd>
				<span className="devtools:opacity-60">+</span>
				<kbd className="devtools:rounded devtools:border devtools:border-border devtools:bg-muted devtools:px-1.5 devtools:py-0.5 devtools:font-mono devtools:text-[10px] devtools:shadow-sm">
					D
				</kbd>
				<span className="devtools:opacity-60">to toggle DevTools</span>
			</div>
		</div>
	);
}
