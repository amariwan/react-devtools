import { Button, SearchField, Select } from "@next-devtools/ui";

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
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 6,
				flexWrap: "wrap",
				padding: 8,
				borderBottom: "1px solid var(--border, #e4e4e7)",
			}}
		>
			<div style={{ fontSize: 12, fontWeight: 600, flex: "0 0 auto" }}>
				Component Tree
			</div>
			<div style={{ flex: "1 0 100%", minWidth: 0, order: 1 }}>
				<SearchField
					value={query}
					onChange={onQueryChange}
					placeholder="Filter components…"
				/>
			</div>
			{roots.length > 1 ? (
				<div style={{ width: 96 }}>
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
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => void onRefresh()}
			>
				Refresh
			</Button>
		</div>
	);
}
