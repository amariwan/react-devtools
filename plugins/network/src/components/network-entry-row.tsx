import type { NetworkEntry } from "@next-devtools/core";
import { Badge, Button, TableCell, TableRow } from "@next-devtools/ui";
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
	return (
		<React.Fragment key={entry.id}>
			<TableRow>
				<TableCell>
					<Button
						variant="ghost"
						aria-expanded={expanded}
						onClick={() => onToggle()}
						className="devtools:w-full devtools:justify-start devtools:font-mono devtools:text-xs"
						title={entry.url}
					>
						<span className="devtools:truncate">
							{networkRequestLabel(entry.url)}
						</span>
					</Button>
				</TableCell>
				<TableCell>
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
				<TableCell className="devtools:text-xs devtools:text-muted-foreground">
					{entry.initiatorType}
				</TableCell>
				<TableCell className="devtools:text-right devtools:font-mono devtools:text-xs devtools:tabular-nums">
					{Math.round(entry.duration)} ms
				</TableCell>
				<TableCell className="devtools:text-right devtools:font-mono devtools:text-xs devtools:tabular-nums">
					{entry.transferSize} B
				</TableCell>
			</TableRow>
			{expanded && (
				<TableRow>
					<TableCell colSpan={5} className="devtools:bg-muted/30">
						<dl className="devtools:grid devtools:grid-cols-[auto_1fr] devtools:gap-x-4 devtools:gap-y-2 devtools:px-2 devtools:py-1 devtools:text-xs">
							<dt className="devtools:text-muted-foreground">URL</dt>
							<dd className="devtools:break-all devtools:font-mono">
								{entry.url}
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
					</TableCell>
				</TableRow>
			)}
		</React.Fragment>
	);
}
