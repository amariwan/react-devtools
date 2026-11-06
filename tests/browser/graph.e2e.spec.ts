import { type Page, expect, test } from "@playwright/test";

async function selectPanel(
	page: Page,
	id: string,
	name: string,
): Promise<void> {
	const navigation = page.getByRole("combobox", { name: "DevTools panel" });
	if (await navigation.isVisible()) {
		await navigation.selectOption(id);
		return;
	}
	await page.getByRole("tab", { name }).click();
}

test("graph fits a selected component in a compact dock", async ({ page }) => {
	await page.setViewportSize({ width: 440, height: 900 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await selectPanel(page, "components", "Components");
	const tree = page.getByRole("tree", { name: "React component tree" });
	const componentWithState = tree
		.getByRole("treeitem", { name: /has state/ })
		.first();
	await componentWithState.evaluate((element) =>
		element.scrollIntoView({ block: "center", inline: "nearest" }),
	);
	await componentWithState
		.getByText("ErrorBoundaryHandler", { exact: true })
		.click();
	await selectPanel(page, "graph", "Graph");
	const panel = page.getByRole("tabpanel");
	await expect(
		panel.getByRole("img", { name: /(?:[2-9]|[1-9]\d+) nodes/ }),
	).toBeVisible();
	await expect(
		panel.getByRole("img", { name: /Reactive dependency graph/ }),
	).toHaveAttribute("data-layout-state", "complete");
	await page.screenshot({
		path: "/tmp/react-devtools-after/graph-compact-initial.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await expect(
		page.getByRole("button", { name: "Switch to light theme" }),
	).toBeVisible();
	await expect(
		page.getByRole("img", { name: /Reactive dependency graph/ }),
	).toHaveCSS("background-color", "rgb(10, 10, 12)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/graph-compact-dark.png",
		animations: "disabled",
	});
});

test("graph panel opens", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await selectPanel(page, "components", "Components");
	const tree = page.getByRole("tree", { name: "React component tree" });
	const componentWithState = tree
		.getByRole("treeitem", { name: /has state/ })
		.first();
	await expect(componentWithState).toBeVisible();
	await componentWithState.click();
	await selectPanel(page, "graph", "Graph");
	const panel = page.getByRole("tabpanel");
	await expect(panel).toBeVisible();
	await expect(
		panel.getByText("Dependencies of the selected component"),
	).toBeVisible();
	const graphCanvas = panel.getByRole("img", {
		name: /Reactive dependency graph/,
	});
	await expect(graphCanvas).toHaveAttribute(
		"aria-label",
		/(?:[2-9]|[1-9]\d+) nodes/,
	);
	await expect(panel.locator(".devtools-graph-inspector")).toHaveCount(0);
	await expect(
		panel.getByText("Select a node to inspect its reactive metadata"),
	).toBeVisible();
	await expect
		.poll(async () => {
			const [layout, canvas] = await Promise.all([
				panel.locator(".devtools-graph-layout").boundingBox(),
				panel.locator(".graph-canvas-shell").boundingBox(),
			]);
			return layout && canvas
				? Math.abs(layout.width - canvas.width)
				: Number.POSITIVE_INFINITY;
		})
		.toBeLessThan(1);
	await expect(graphCanvas).toHaveAttribute("data-layout-state", "complete");
	const layoutDurationMs = Number(
		await graphCanvas.getAttribute("data-layout-duration-ms"),
	);
	expect(Number.isFinite(layoutDurationMs) && layoutDurationMs > 0).toBe(true);
	console.info(
		`Browser graph layout: ${layoutDurationMs.toFixed(1)} ms (${await graphCanvas.getAttribute("aria-label")})`,
	);
	await page.screenshot({
		path: "/tmp/react-devtools-after/graph-unselected-desktop.png",
		animations: "disabled",
	});
	const nodeFilterTrigger = panel.getByRole("button", {
		name: /Node type filters/,
	});
	await nodeFilterTrigger.focus();
	await page.keyboard.press("Enter");
	await expect(
		panel.getByRole("group", { name: "Node type filters" }),
	).toBeVisible();
	await page.keyboard.press("Enter");
	await panel.getByText("Accessible node list").click();
	await panel
		.getByRole("button", { name: /· Component · Observed/ })
		.first()
		.click();
	await expect(panel.locator(".devtools-graph-inspector")).toBeVisible();
	await expect(panel.getByText("Component id")).toBeVisible();
	await page.waitForTimeout(300);
	await page.screenshot({
		path: "/tmp/react-devtools-after/graph-selected-desktop.png",
		animations: "disabled",
	});
	const graphContent = panel.locator(".devtools-graph-layout > div").first();
	const legendBounds = await graphContent
		.locator(":scope > div")
		.last()
		.boundingBox();
	const pickerBounds = await page
		.getByRole("button", { name: "Pick element" })
		.boundingBox();
	if (!legendBounds || !pickerBounds)
		throw new Error("Graph legend or launcher is not rendered");
	expect(legendBounds.y + legendBounds.height).toBeLessThanOrEqual(
		pickerBounds.y,
	);
	const viewOptions = panel.getByRole("button", { name: "View options" });
	await viewOptions.focus();
	await page.keyboard.press("Enter");
	await expect(
		page
			.getByRole("dialog")
			.getByRole("group", { name: "Graph layout and scope" }),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await page.setViewportSize({ width: 440, height: 900 });
	const graph = panel.locator(".devtools-graph-layout");
	const canvas = graph.locator(".graph-canvas-shell");
	const inspector = graph.locator(".devtools-graph-inspector");
	await expect
		.poll(async () => {
			const [canvasBounds, inspectorBounds] = await Promise.all([
				canvas.boundingBox(),
				inspector.boundingBox(),
			]);
			return Boolean(
				canvasBounds &&
					inspectorBounds &&
					inspectorBounds.y >= canvasBounds.y + canvasBounds.height,
			);
		})
		.toBe(true);
	await page.waitForTimeout(650);
	await page.screenshot({
		path: "/tmp/react-devtools-after/graph-compact.png",
		animations: "disabled",
	});
});

test("graph icon actions expose accessible names", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await selectPanel(page, "graph", "Graph");
	await expect(
		page.getByRole("tabpanel").getByRole("img", {
			name: /Reactive dependency graph/,
		}),
	).toBeVisible();

	const buttons = await page.getByRole("tabpanel").getByRole("button").all();
	expect(buttons.length).toBeGreaterThan(0);
	const unnamedButtons: string[] = [];
	for (const button of buttons) {
		const name = await button.evaluate((element) => {
			const labelledBy = element
				.getAttribute("aria-labelledby")
				?.split(/\s+/)
				.map((id) => element.ownerDocument.getElementById(id)?.textContent)
				.filter(Boolean)
				.join(" ");
			return (
				element.getAttribute("aria-label")?.trim() ||
				labelledBy?.trim() ||
				element.getAttribute("title")?.trim() ||
				element.textContent?.trim() ||
				""
			);
		});
		if (!name)
			unnamedButtons.push(
				await button.evaluate((element) => element.outerHTML),
			);
	}
	expect(unnamedButtons).toEqual([]);
});

test("components panel keeps the selected React root across panel switches", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await selectPanel(page, "components", "Components");
	const rootSelect = page.getByRole("combobox", { name: "React root" });
	await rootSelect.selectOption({ label: "Root 2" });
	const selectedRoot = await rootSelect.inputValue();
	const tree = page.getByRole("tree", { name: "React component tree" });
	await tree
		.getByRole("treeitem", { name: /has state/ })
		.first()
		.click();
	await selectPanel(page, "graph", "Graph");
	await expect(
		page.getByRole("img", { name: /Reactive dependency graph/ }),
	).toBeVisible();
	await selectPanel(page, "components", "Components");
	await expect(rootSelect).toHaveValue(selectedRoot);
});
