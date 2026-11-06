import { expect, test } from "@playwright/test";

test("components panel shows component tree", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Components" }).click();
	const panel = page.getByRole("tabpanel");
	const tree = panel.getByRole("tree", { name: "React component tree" });
	await expect(tree).toBeVisible();
	await expect(tree.getByRole("treeitem").first()).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-before/components-panel.png",
		animations: "disabled",
	});
	const firstItem = tree.getByRole("treeitem").first();
	await firstItem.focus();
	await firstItem.press("ArrowDown");
	await expect(tree.getByRole("treeitem").nth(1)).toBeFocused();
	const search = panel.getByRole("textbox", { name: "Filter components" });
	await search.fill("Context.Provider");
	await expect(tree.getByText("Root", { exact: true }).first()).toBeVisible();
	const matchingNode = tree
		.getByText("Context.Provider", { exact: true })
		.first();
	await expect(matchingNode).toBeVisible();
	await expect(matchingNode).toHaveClass(/devtools:bg-primary\/10/);
	await page.screenshot({
		path: "/tmp/react-devtools-after/components-tree-search.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await expect(
		page.getByRole("button", { name: "Switch to light theme" }),
	).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/components-tree-search-dark.png",
		animations: "disabled",
	});
});

test("component tree uses the available height in a compact dock", async ({
	page,
}) => {
	await page.setViewportSize({ width: 440, height: 520 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page
		.getByRole("combobox", { name: "DevTools panel" })
		.selectOption("components");
	await page.getByRole("button", { name: "Tree", exact: true }).click();

	const panel = page.getByRole("tabpanel");
	const tree = panel.getByRole("tree", { name: "React component tree" });
	await expect(tree).toBeVisible();
	await tree.scrollIntoViewIfNeeded();
	await expect
		.poll(async () => {
			const [treeBounds, panelBounds] = await Promise.all([
				tree.boundingBox(),
				panel.boundingBox(),
			]);
			if (!treeBounds || !panelBounds) return false;
			return (
				treeBounds.y >= panelBounds.y &&
				treeBounds.y + treeBounds.height <=
					panelBounds.y + panelBounds.height + 1
			);
		})
		.toBe(true);
	const treeHeight = await tree.evaluate((element) => element.clientHeight);
	expect(treeHeight).toBeGreaterThan(100);
	expect(treeHeight).toBeLessThan(420);
	await page.screenshot({
		path: "/tmp/react-devtools-after/components-tree-short-compact.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await expect(tree).toBeVisible();
	await expect(tree).toHaveCSS("color", "rgb(228, 228, 231)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/components-tree-short-compact-dark.png",
		animations: "disabled",
	});
});
