import type { PluginRegistry } from "@next-devtools/core";
import { Input, Label, PanelHeader } from "@next-devtools/ui";
import * as React from "react";

export default function ShowcaseCustomPanel({
	registry,
}: {
	registry: PluginRegistry;
}) {
	const [greeting, setGreeting] = React.useState(
		(registry.settings.get("showcase.custom").greeting as string) ?? "Hello",
	);
	return (
		<div className="devtools:flex devtools:min-h-0 devtools:flex-col">
			<PanelHeader
				title="Showcase Custom Inspector"
				description="Edit the value stored by this custom inspector."
			/>
			<div className="devtools:flex devtools:flex-col devtools:gap-2 devtools:p-3">
				<Label htmlFor="showcase-greeting">Greeting</Label>
				<Input
					id="showcase-greeting"
					value={greeting}
					onChange={(e) => {
						setGreeting(e.target.value);
						registry.settings.set("showcase.custom", {
							greeting: e.target.value,
						});
					}}
				/>
				<output className="devtools:rounded-md devtools:border devtools:border-border devtools:bg-muted/50 devtools:px-3 devtools:py-2 devtools:text-sm">
					{greeting}, world!
				</output>
			</div>
		</div>
	);
}
