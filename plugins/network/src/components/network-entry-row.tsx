import type { NetworkEntry } from "@next-devtools/core";
import {
	Badge,
	Button,
	CircleCheck,
	Copy,
	IconButton,
	TableCell,
	TableRow,
} from "@next-devtools/ui";
import * as React from "react";

type NetworkEntryRowProps = {
	entry: NetworkEntry;
	expanded: boolean;
	onToggle: () => void;
};

export function networkRequestLabel(rawUrl: string): string {
	try {
		const url = new URL(rawUrl);
		const segments = url.pathname.split("/").filter(Boolean);
		const path = segments.slice(-2).join("/");
		return `${path || `${url.host}/`}${url.search}`;
	} catch {
		return rawUrl;
	}
}

export function NetworkEntryRow({
	entry,
	expanded,
	onToggle,
}: NetworkEntryRowProps) {
	const [copyStatus, setCopyStatus] = React.useState<string | null>(null);
	const copyRequestUrl = async () => {
		try {
			if (!navigator.clipboard?.writeText)
				throw new Error("Clipboard access is unavailable.");
			await navigator.clipboard.writeText(entry.url);
			setCopyStatus("Request URL copied to clipboard.");
		} catch {
			setCopyStatus(
				"Could not copy request URL. Clipboard access is unavailable.",
			);
		}
	};

	return (
		<React.Fragment key={entry.id}>
			<TableRow>
				<TableCell className="devtools:py-1 devtools:@max-md:px-1">
					<Button
						variant="ghost"
						size="xs"
						aria-expanded={expanded}
						onClick={() => onToggle()}
						className="devtools:w-full devtools:min-w-0 devtools:justify-start devtools:font-mono devtools:text-xs devtools:@max-md:h-auto devtools:@max-md:flex-col devtools:@max-md:items-start devtools:@max-md:gap-0.5 devtools:@max-md:py-1"
						title={entry.url}
					>
						<span className="devtools:w-full devtools:min-w-0 devtools:truncate">
							{networkRequestLabel(entry.url)}
						</span>
						<span className="devtools:hidden devtools:font-sans devtools:text-[10px] devtools:text-muted-foreground devtools:@max-md:block">
							{entry.initiatorType}
						</span>
					</Button>
				</TableCell>
				<TableCell className="devtools:py-1 devtools:@max-md:px-1">
					<Badge
						variant={
							entry.status !== undefined && entry.status >= 400
								? "destructive"
								: "outline"
						}
					>
						{entry.status ?? "—"}
					</Badge>
				</TableCell>
				<TableCell className="devtools:py-1 devtools:text-xs devtools:text-muted-foreground devtools:@max-md:hidden">
					{entry.initiatorType}
				</TableCell>
				<TableCell className="devtools:py-1 devtools:whitespace-nowrap devtools:text-right devtools:font-mono devtools:text-xs devtools:tabular-nums devtools:@max-md:px-1">
					{Math.round(entry.duration)} ms
				</TableCell>
				<TableCell className="devtools:py-1 devtools:text-right devtools:font-mono devtools:text-xs devtools:tabular-nums devtools:@max-md:hidden">
					{entry.transferSize} B
				</TableCell>
			</TableRow>
			{expanded && (
				<TableRow>
					<TableCell colSpan={5} className="devtools:bg-muted/30">
						<dl className="devtools:grid devtools:grid-cols-[auto_1fr] devtools:gap-x-4 devtools:gap-y-2 devtools:px-2 devtools:py-1 devtools:text-xs">
							<dt className="devtools:text-muted-foreground">URL</dt>
							<dd className="devtools:flex devtools:min-w-0 devtools:items-center devtools:gap-1.5">
								<code
									title={entry.url}
									className="devtools:min-w-0 devtools:flex-1 devtools:truncate devtools:font-mono"
								>
									<span aria-hidden="true">
										{networkRequestLabel(entry.url)}
									</span>
									<span className="devtools:sr-only">{entry.url}</span>
								</code>
								<IconButton
									icon={
										copyStatus === "Request URL copied to clipboard."
											? CircleCheck
											: Copy
									}
									label="Copy request URL"
									variant="ghost"
									size="icon-xs"
									onClick={() => void copyRequestUrl()}
								/>
							</dd>
							<dt className="devtools:text-muted-foreground">Start time</dt>
							<dd>{entry.startTime.toFixed(2)} ms</dd>
							<dt className="devtools:text-muted-foreground">Captured</dt>
							<dd>{new Date(entry.capturedAtUnixMs).toLocaleString()}</dd>
							<dt className="devtools:text-muted-foreground">
								Encoded / decoded
							</dt>
							<dd>
								{entry.encodedBodySize} B / {entry.decodedBodySize} B
							</dd>
						</dl>
						{copyStatus ? (
							<span className="devtools:sr-only" role="status">
								{copyStatus}
							</span>
						) : null}
					</TableCell>
				</TableRow>
			)}
		</React.Fragment>
	);
}
