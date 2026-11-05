import { expect, test } from "@playwright/test";

test("components panel shows component tree", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Components" }).click();
	const panel = page.getByRole("tabpanel");
	await expect(
		panel.getByRole("tree", { name: "React component tree" }),
	).toBeVisible();
});
