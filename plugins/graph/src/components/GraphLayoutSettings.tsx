import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Select,
	Slider,
} from "@next-devtools/ui";
import * as React from "react";
import type { FcoseSettings } from "../lib/graph-layout.js";
import {
	FCOSE_BOUNDS,
	FCOSE_QUALITY_OPTIONS,
	clampFcoseSettings,
	hasBlockingFcoseIssues,
	validateFcoseSettings,
} from "../lib/graph-layout.js";

export interface GraphLayoutSettingsProps {
	readonly open: boolean;
	readonly onClose: () => void;
	readonly settings: FcoseSettings;
	readonly onSettingsChange: (value: FcoseSettings) => void;
	readonly nodeCount: number;
}

export function GraphLayoutSettings({
	open,
	onClose,
	settings,
	onSettingsChange,
	nodeCount,
}: GraphLayoutSettingsProps) {
	const [draft, setDraft] = React.useState<FcoseSettings>(settings);
	React.useEffect(() => setDraft(settings), [settings]);

	const issues = validateFcoseSettings(draft, nodeCount);
	const blocking = hasBlockingFcoseIssues(issues);

	const update = <K extends keyof FcoseSettings>(
		key: K,
		value: FcoseSettings[K],
	) => {
		setDraft((previous) => clampFcoseSettings({ ...previous, [key]: value }));
	};

	const apply = () => {
		if (blocking) return;
		onSettingsChange(clampFcoseSettings(draft));
		onClose();
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) onClose();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>fCoSE settings</DialogTitle>
					<DialogDescription>
						Tune the force-directed layout. Changes apply on the next layout
						run.
					</DialogDescription>
				</DialogHeader>

				<div className="devtools:flex devtools:flex-col devtools:gap-2.5">
					<div className="devtools:flex devtools:flex-col devtools:gap-1 devtools:text-xs">
						Quality
						<Select
							value={draft.quality}
							onChange={(value) =>
								update("quality", value as FcoseSettings["quality"])
							}
							options={FCOSE_QUALITY_OPTIONS.map((option) => ({
								value: option.value,
								label: `${option.label} — ${option.description}`,
							}))}
							aria-label="fCoSE quality"
						/>
					</div>

					{(Object.keys(FCOSE_BOUNDS) as Array<keyof typeof FCOSE_BOUNDS>).map(
						(key) => {
							const bounds = FCOSE_BOUNDS[key];
							return (
								<div
									key={key}
									className="devtools:flex devtools:flex-col devtools:gap-1"
								>
									<div className="devtools:flex devtools:items-center devtools:justify-between devtools:text-xs">
										<span>{bounds.label}</span>
										<span className="devtools:font-mono devtools:tabular-nums devtools:text-muted-foreground">
											{draft[key].toFixed(
												key === "edgeElasticity" || key === "gravity" ? 2 : 0,
											)}
										</span>
									</div>
									<Slider
										min={bounds.min}
										max={bounds.max}
										step={bounds.step}
										value={draft[key]}
										onValueChange={(value) => update(key, Number(value))}
									/>
									<span className="devtools:text-[10px] devtools:text-muted-foreground">
										{bounds.hint}
									</span>
								</div>
							);
						},
					)}

					<label className="devtools:flex devtools:items-center devtools:gap-1.5 devtools:text-xs">
						<Checkbox
							checked={draft.animate}
							onCheckedChange={(checked) => update("animate", checked === true)}
							aria-label="Animate layout"
						/>
						Animate layout
					</label>

					{issues.length > 0 ? (
						<div className="devtools:flex devtools:flex-col devtools:gap-0.5 devtools:text-xs devtools:text-destructive">
							{issues.map((issue) => (
								<span key={issue.message}>
									{issue.level === "error" ? "Error: " : "Warning: "}
									{issue.message}
								</span>
							))}
						</div>
					) : null}
				</div>

				<DialogFooter>
					<Button variant="ghost" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button size="sm" onClick={apply} disabled={blocking}>
						Apply
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
