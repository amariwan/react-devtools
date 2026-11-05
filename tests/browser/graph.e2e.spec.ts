import { expect, test } from "@playwright/test";

test("graph panel opens", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Graph" }).click();
	const panel = page.getByRole("tabpanel");
	await expect(panel).toBeVisible();
});
