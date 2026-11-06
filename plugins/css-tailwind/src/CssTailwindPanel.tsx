import type { PluginRegistry } from "@next-devtools/core";
import {
	Badge,
	Braces,
	Button,
	Copy,
	EmptyState,
	IconButton,
	Info,
	ListTree,
	PanelHeader,
	RefreshCw,
	SearchField,
	Toolbar,
	Wind,
} from "@next-devtools/ui";
import * as React from "react";
import {
	type CssHostSnapshot,
	type CssVariableDeclaration,
	buildCssData,
} from "./css-data.js";

function collectDeclarations(
	rules: CSSRuleList,
	source: string,
	declarations: CssVariableDeclaration[],
): void {
	for (const rule of Array.from(rules)) {
		if ("selectorText" in rule && "style" in rule) {
			const styleRule = rule as CSSStyleRule;
			for (let index = 0; index < styleRule.style.length; index += 1) {
				const name = styleRule.style.item(index);
				if (!name.startsWith("--")) continue;
				declarations.push({
					name,
					selector: styleRule.selectorText,
					source,
					value: styleRule.style.getPropertyValue(name).trim(),
				});
			}
		}
		if ("cssRules" in rule) {
			collectDeclarations(
				(rule as CSSGroupingRule).cssRules,
				source,
				declarations,
			);
		}
	}
}

function collectCss(): CssHostSnapshot {
	const stylesheets: string[] = [];
	const declarations: CssVariableDeclaration[] = [];
	if (typeof document === "undefined") return { stylesheets, declarations };
	const sheets = Array.from(document.styleSheets ?? []);
	for (const sheet of sheets) {
		try {
			const rules = Array.from(sheet.cssRules ?? []);
			stylesheets.push(rules.map((r) => r.cssText).join("\n"));
			collectDeclarations(
				sheet.cssRules,
				sheet.href ?? "inline stylesheet",
				declarations,
			);
		} catch {
			// Cross-origin stylesheets cannot be read; skip.
		}
	}
	// Also include inline style tags.
	const styleTags = Array.from(document.querySelectorAll("style"));
	for (const tag of styleTags) {
		if (tag.textContent) stylesheets.push(tag.textContent);
	}
	return { stylesheets, declarations };
}

export default function CssTailwindPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	void registry;
	const [snapshot, setSnapshot] = React.useState<CssHostSnapshot>(() => ({
		stylesheets: [],
	}));

	React.useEffect(() => {
		setSnapshot(collectCss());
	}, []);

	const data = React.useMemo(() => buildCssData(snapshot), [snapshot]);

	const [query, setQuery] = React.useState("");
	const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
	const [copyError, setCopyError] = React.useState<string | null>(null);
	const copyToken = async (token: string) => {
		const value = `var(${token})`;
		setCopyStatus(null);
		setCopyError(null);
		try {
			if (!navigator.clipboard?.writeText) {
				throw new Error("Clipboard access is unavailable.");
			}
			await navigator.clipboard.writeText(value);
			setCopyStatus(`Copied ${value}.`);
		} catch {
			setCopyError(`Could not copy ${value}. Check clipboard permissions.`);
		}
	};
	const tokens = data.tokens.filter((token) =>
		token.name.toLowerCase().includes(query.trim().toLowerCase()),
	);
	return (
		<div className="devtools:flex devtools:min-h-0 devtools:flex-col">
			<PanelHeader
				title="CSS / Tailwind"
				actions={
					<>
						<IconButton
							icon={Info}
							label="About stylesheet scanning"
							title="Only readable stylesheets are scanned. Cross-origin sheets are excluded."
							variant="ghost"
						/>
						<IconButton
							icon={RefreshCw}
							label="Refresh stylesheets"
							variant="outline"
							onClick={() => setSnapshot(collectCss())}
						/>
					</>
				}
			/>
			<Toolbar className="devtools:flex-wrap devtools:gap-1.5">
				<SearchField
					aria-label="Search CSS tokens"
					placeholder="Search tokens…"
					value={query}
					onChange={setQuery}
				/>
				<Badge
					variant="secondary"
					title={`${data.tokens.length} CSS custom properties`}
					aria-label={`${data.tokens.length} CSS custom properties`}
					className="devtools:gap-1 devtools:px-1.5"
				>
					<Braces aria-hidden="true" className="devtools:size-3" />
					{data.tokens.length}
				</Badge>
				<Badge
					variant="outline"
					title={`${data.ruleCount} CSS rules`}
					aria-label={`${data.ruleCount} CSS rules`}
					className="devtools:gap-1 devtools:px-1.5"
				>
					<ListTree aria-hidden="true" className="devtools:size-3" />
					{data.ruleCount}
				</Badge>
				<Badge
					variant="outline"
					title={`Tailwind CSS ${data.tailwindDetected ? "detected" : "not detected"}`}
					aria-label={`Tailwind CSS ${data.tailwindDetected ? "detected" : "not detected"}`}
					className="devtools:gap-1 devtools:px-1.5"
				>
					<Wind aria-hidden="true" className="devtools:size-3" />
					<span
						className={
							data.tailwindDetected
								? "devtools:size-1.5 devtools:rounded-full devtools:bg-success"
								: "devtools:size-1.5 devtools:rounded-full devtools:bg-muted-foreground"
						}
						aria-hidden="true"
					/>
				</Badge>
			</Toolbar>
			{copyStatus && (
				<p
					role="status"
					className="devtools:px-3 devtools:text-xs devtools:text-muted-foreground"
				>
					{copyStatus}
				</p>
			)}
			{copyError && (
				<p
					role="alert"
					className="devtools:px-3 devtools:text-xs devtools:text-destructive"
				>
					{copyError}
				</p>
			)}
			{data.tokens.length === 0 ? (
				<EmptyState
					title="No custom properties found"
					description={
						data.ruleCount > 0
							? "Readable stylesheets contain no CSS custom properties."
							: "Load application stylesheets, then refresh to scan them."
					}
					action={
						<Button variant="outline" onClick={() => setSnapshot(collectCss())}>
							<RefreshCw aria-hidden="true" />
							Refresh stylesheets
						</Button>
					}
				/>
			) : tokens.length === 0 ? (
				<EmptyState
					title="No matching properties"
					description="Try another token name."
				/>
			) : (
				<ul className="devtools:m-0 devtools:list-none devtools:divide-y devtools:divide-border devtools:p-0">
					{tokens.map((token) => {
						const singleDeclaration =
							token.declarations.length === 1
								? token.declarations[0]
								: undefined;
						return (
							<li
								key={token.name}
								className="devtools:flex devtools:flex-col devtools:gap-1 devtools:px-3 devtools:py-2 devtools:font-mono devtools:text-xs"
							>
								<div className="devtools:flex devtools:min-w-0 devtools:items-center devtools:justify-between devtools:gap-2">
									<code className="devtools:min-w-0 devtools:break-all">
										{token.name}
									</code>
									<IconButton
										icon={Copy}
										label={`Copy var(${token.name})`}
										size="icon-xs"
										onClick={() => void copyToken(token.name)}
									/>
								</div>
								{singleDeclaration ? (
									<div className="devtools:flex devtools:min-w-0 devtools:flex-wrap devtools:gap-x-2 devtools:text-[11px]">
										<code className="devtools:break-all devtools:text-foreground">
											{singleDeclaration.value || "(empty)"}
										</code>
										<span className="devtools:break-all devtools:text-muted-foreground">
											{singleDeclaration.selector} · {singleDeclaration.source}
										</span>
									</div>
								) : token.declarations.length > 1 ? (
									<details className="devtools:text-[11px]">
										<summary className="devtools:cursor-pointer devtools:text-muted-foreground">
											{token.declarations.length} declarations
										</summary>
										<ul className="devtools:m-0 devtools:mt-1 devtools:list-none devtools:space-y-1 devtools:p-0">
											{token.declarations.map((declaration, index) => (
												<li
													key={`${declaration.selector}-${index}`}
													className="devtools:flex devtools:min-w-0 devtools:flex-wrap devtools:gap-x-2"
												>
													<code className="devtools:break-all devtools:text-foreground">
														{declaration.value || "(empty)"}
													</code>
													<span className="devtools:break-all devtools:text-muted-foreground">
														{declaration.selector} · {declaration.source}
													</span>
												</li>
											))}
										</ul>
									</details>
								) : (
									<span className="devtools:text-[11px] devtools:text-muted-foreground">
										Declaration details unavailable
									</span>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
