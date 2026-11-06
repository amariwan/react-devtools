import { expect, test } from "@playwright/test";

test("network panel opens", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Network" }).click();
	const panel = page.getByRole("tabpanel");
	await expect(panel).toBeVisible();
});

test("network table fits compact panels and keeps request details reachable", async ({
	page,
}) => {
	await page.setViewportSize({ width: 440, height: 956 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("combobox", { name: "DevTools panel" }).selectOption({
		label: "Network",
	});
	const panel = page.getByRole("tabpanel");
	await expect(panel.getByRole("heading", { name: "Network" })).toBeVisible();
	await expect(panel.getByText(/Recording · \d+ requests/)).toBeVisible();
	const searchBounds = await panel
		.getByRole("textbox", { name: "Network request search" })
		.boundingBox();
	const typeBounds = await panel
		.getByRole("combobox", { name: "Network initiator filter" })
		.boundingBox();
	expect(searchBounds).not.toBeNull();
	expect(typeBounds).not.toBeNull();
	expect(
		Math.abs(
			(searchBounds?.y ?? 0) +
				(searchBounds?.height ?? 0) / 2 -
				((typeBounds?.y ?? 0) + (typeBounds?.height ?? 0) / 2),
		),
	).toBeLessThan(1);
	await expect(
		panel.getByRole("group", { name: "Network capture actions" }),
	).toBeVisible();
	const table = panel.getByRole("table");
	await expect(table.getByRole("row").nth(1)).toBeVisible();
	await expect(table.getByRole("columnheader", { name: "Size" })).toBeHidden();
	await expect(table.getByRole("columnheader", { name: "Type" })).toBeHidden();
	const inlineType = table
		.locator("tbody tr td:first-child span:nth-child(2)")
		.first();
	await expect(inlineType).toBeVisible();
	await expect(inlineType).toHaveText(
		/^(link|script|img|fetch|xmlhttprequest)$/,
	);
	const dimensions = await table.evaluate((element) => {
		const container = element.parentElement;
		return {
			table: element.getBoundingClientRect().width,
			container: container?.clientWidth ?? 0,
			request:
				element.querySelector("tbody tr td")?.getBoundingClientRect().width ??
				0,
			status:
				element
					.querySelector("tbody tr td:nth-child(2)")
					?.getBoundingClientRect().width ?? 0,
		};
	});
	expect(dimensions.table).toBeLessThanOrEqual(dimensions.container + 1);
	expect(dimensions.request).toBeGreaterThan(dimensions.status);

	await table.getByRole("row").nth(1).getByRole("button").click();
	await expect(panel.getByText("Start time")).toBeVisible();
	await expect(
		panel.evaluate((element) => element.scrollWidth <= element.clientWidth),
	).resolves.toBe(true);
	await page.screenshot({
		path: "/tmp/react-devtools-after/network-recording-compact.png",
		fullPage: true,
	});
	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	const copyUrlButton = panel.getByRole("button", {
		name: "Copy request URL",
	});
	const fullRequestUrl = await panel
		.locator("code[title]")
		.getAttribute("title");
	await copyUrlButton.click();
	await expect(panel.getByRole("status")).toHaveText(
		"Request URL copied to clipboard.",
	);
	await expect
		.poll(() => page.evaluate(() => navigator.clipboard.readText()))
		.toBe(fullRequestUrl);
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await expect(table.getByRole("columnheader", { name: "Type" })).toBeHidden();
	await expect(inlineType).toBeVisible();
	await expect(
		table.locator("tbody tr td:first-child button").first(),
	).toHaveCSS("color", "rgb(228, 228, 231)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/network-recording-compact-dark.png",
		fullPage: true,
	});
});
