import type { EncodedValue } from "@next-devtools/contracts";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { childrenOf } from "../helpers/value-format.js";
import { EncodedValueBranch } from "./encoded-value-branch.js";
import { EmptyState, IconButton, SearchField, StatusDot } from "./primitives";
import { Select } from "./ui/select.js";

export interface StoreInspectorProps {
	adapters: readonly { id: string; label: string }[];
	selectedAdapterId?: string | undefined;
	status?: string | undefined;
	loading?: boolean | undefined;
	reason?: string | undefined;
	value?: EncodedValue | undefined;
	onSelect: (id: string) => void | Promise<void>;
	onRefresh: () => void | Promise<void>;
}

export function StoreInspector({
	adapters,
	selectedAdapterId,
	status = "unavailable",
	loading = false,
	reason,
	value,
	onSelect,
	onRefresh,
}: StoreInspectorProps) {
	const [query, setQuery] = React.useState("");
	const [actionError, setActionError] = React.useState<string | null>(null);
	const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
	const id = React.useId();
	const properties = React.useMemo(
		() => (value === undefined ? [] : childrenOf(value)),
		[value],
	);
	const matches = properties.filter((property) =>
		property.key.toLowerCase().includes(query.trim().toLowerCase()),
	);
	const perform = async (action: () => void | Promise<void>) => {
		setActionError(null);
		try {
			await action();
		} catch (cause) {
			setActionError(
				cause instanceof Error
					? cause.message
					: "Could not read this store. Try refreshing.",
			);
		}
	};
	const copyValue = async (valueToCopy: EncodedValue, path: string) => {
		setActionError(null);
		setCopyStatus(null);
		try {
			const text = JSON.stringify(valueToCopy, null, 2);
			if (text === undefined || !navigator.clipboard?.writeText) {
				throw new Error("Clipboard access is unavailable.");
			}
			await navigator.clipboard.writeText(text);
			setCopyStatus(`Copied JSON at ${path}.`);
		} catch {
			setActionError("Could not copy value. Check clipboard permissions.");
		}
	};
	return (
		<section
			aria-label="Store inspector"
			aria-busy={loading}
			className="devtools:space-y-2"
		>
			<div className="devtools:flex devtools:flex-wrap devtools:items-end devtools:gap-2">
				<div className="devtools:min-w-0 devtools:flex-1 devtools:text-xs devtools:text-muted-foreground">
					<label htmlFor={id}>Store adapter</label>
					<Select
						id={id}
						label="Store adapter"
						value={selectedAdapterId ?? ""}
						disabled={!adapters.length || loading}
						onChange={(adapterId) => {
							setQuery("");
							void perform(() => onSelect(adapterId));
						}}
						options={[
							{ value: "", label: "Select a store", disabled: true },
							...adapters.map(({ id: adapterId, label }) => ({
								value: adapterId,
								label,
							})),
						]}
						className="devtools:mt-1 devtools:w-full"
					/>
				</div>
				<IconButton
					type="button"
					size="icon-sm"
					variant="outline"
					icon={RefreshCw}
					label={loading ? "Reading store" : "Refresh store"}
					onClick={() => void perform(onRefresh)}
					disabled={!selectedAdapterId || loading}
					aria-busy={loading}
				/>
			</div>
			<div className="devtools:flex devtools:flex-wrap devtools:items-center devtools:gap-2 devtools:text-xs devtools:text-muted-foreground">
				<StatusDot status={status} label={status} />
				{reason && <span>{reason}</span>}
			</div>
			{actionError && (
				<p role="alert" className="devtools:text-xs devtools:text-destructive">
					{actionError}
				</p>
			)}
			{copyStatus && (
				<p
					role="status"
					className="devtools:text-xs devtools:text-muted-foreground"
				>
					{copyStatus}
				</p>
			)}
			{value !== undefined ? (
				<>
					{properties.length > 0 && (
						<SearchField
							value={query}
							onChange={setQuery}
							placeholder="Filter top-level properties…"
							aria-label="Filter store properties"
						/>
					)}
					<section
						aria-label="Store value"
						className="devtools:@container/store-value devtools:max-h-[55dvh] devtools:overflow-auto devtools:rounded-md devtools:border devtools:border-border devtools:bg-card devtools:p-3 devtools:font-mono devtools:text-xs devtools:leading-relaxed"
					>
						{query.trim() ? (
							matches.length ? (
								matches.map((property) => (
									<div
										key={property.key}
										className="devtools:flex devtools:gap-2 devtools:py-1 devtools:@max-[400px]/store-value:flex-col devtools:@max-[400px]/store-value:gap-0"
									>
										<span className="devtools:min-w-0 devtools:basis-2/5 devtools:shrink-0 devtools:break-words devtools:text-muted-foreground devtools:@max-[400px]/store-value:basis-auto">
											{property.key}:
										</span>
										<div className="devtools:min-w-0 devtools:flex-1 devtools:@max-[400px]/store-value:w-full">
											<EncodedValueBranch
												value={property.value}
												path={`$.${property.key}`}
												onCopy={copyValue}
											/>
										</div>
									</div>
								))
							) : (
								<p>No properties match this filter.</p>
							)
						) : (
							<EncodedValueBranch
								key={selectedAdapterId}
								value={value}
								path="$"
								onCopy={copyValue}
							/>
						)}
					</section>
				</>
			) : (
				<EmptyState
					title={loading ? "Reading store…" : "No snapshot selected"}
					description={
						loading
							? "Waiting for the adapter to return its state."
							: "Choose a registered store adapter to inspect its current state."
					}
				/>
			)}
		</section>
	);
}
