import {
	IconButton,
	RefreshCw,
	SearchField,
	Select,
	Toolbar,
} from "@next-devtools/ui";

type ComponentTreeToolbarProps = {
	query: string;
	roots: readonly string[];
	activeRootId: string | null;
	onQueryChange: (value: string) => void;
	onRootChange: (id: string) => void;
	onRefresh: () => Promise<void>;
};

export function ComponentTreeToolbar({
	query,
	roots,
	activeRootId,
	onQueryChange,
	onRootChange,
	onRefresh,
}: ComponentTreeToolbarProps) {
	return (
		<Toolbar className="devtools:gap-1.5 devtools:p-2">
			<div className="devtools:shrink-0 devtools:text-xs devtools:font-semibold">
				Component Tree
			</div>
			<div className="devtools:order-1 devtools:min-w-0 devtools:flex-[1_0_100%]">
				<SearchField
					value={query}
					onChange={onQueryChange}
					placeholder="Filter components…"
					aria-label="Filter components"
				/>
			</div>
			{roots.length > 1 ? (
				<div className="devtools:w-24">
					<Select
						value={activeRootId ?? ""}
						onChange={onRootChange}
						options={roots.map((id, index) => ({
							value: id,
							label: `Root ${index + 1}`,
						}))}
						label="React root"
					/>
				</div>
			) : null}
			<IconButton
				type="button"
				icon={RefreshCw}
				label="Refresh component tree"
				variant="outline"
				size="icon-sm"
				onClick={() => void onRefresh()}
			/>
		</Toolbar>
	);
}
