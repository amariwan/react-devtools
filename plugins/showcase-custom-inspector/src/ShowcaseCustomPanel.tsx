import * as React from "react";
import type { PluginRegistry } from "@next-devtools/core";

export default function ShowcaseCustomPanel({
  registry,
}: {
  registry: PluginRegistry;
}) {
  const [greeting, setGreeting] = React.useState(
    (registry.settings.get("showcase.custom").greeting as string) ?? "Hello",
  );
  return (
    <div>
      <h2>Showcase Custom Inspector</h2>
      <p>{greeting}, world!</p>
      <input
        value={greeting}
        onChange={(e) => {
          setGreeting(e.target.value);
          registry.settings.set("showcase.custom", {
            greeting: e.target.value,
          });
        }}
      />
    </div>
  );
}
