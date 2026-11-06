import { expect, test } from "@playwright/test";

test("CSS inspector shows property values and selectors responsively", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/");
	await page.addStyleTag({
		content:
			":root { --e2e-css-token: #b84; } [data-theme=dark] { --e2e-css-token: #449; }",
	});
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "CSS/Tailwind" }).click();

	const panel = page.getByRole("tabpanel");
	await expect(
		panel.getByRole("button", { name: "About stylesheet scanning" }),
	).toBeVisible();
	await expect(
		panel.getByText("--e2e-css-token", { exact: true }),
	).toBeVisible();
	const token = panel.locator("li").filter({ hasText: "--e2e-css-token" });
	await token.locator("details > summary").click();
	await expect(token.getByText("#b84", { exact: true })).toBeVisible();
	await expect(token.getByText("#449", { exact: true })).toBeVisible();
	await expect(token.getByText(":root ·", { exact: false })).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/css-tailwind-desktop-light.png",
		animations: "disabled",
	});

	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/css-tailwind-desktop-dark.png",
		animations: "disabled",
	});

	await page.setViewportSize({ width: 440, height: 900 });
	await page
		.getByRole("combobox", { name: "DevTools panel" })
		.selectOption("css-tailwind");
	await page.screenshot({
		path: "/tmp/react-devtools-after/css-tailwind-compact-dark.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to light theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/css-tailwind-compact-light.png",
		animations: "disabled",
	});
});
