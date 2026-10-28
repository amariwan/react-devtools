import { expect, test } from "@playwright/test";

test("production has no active DevTools instrumentation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", { name: "Open Next.js DevTools" }),
  ).toHaveCount(0);
  await expect(page.locator("next-devtools-root")).toHaveCount(0);
  await expect(
    page.evaluate(() =>
      Object.prototype.hasOwnProperty.call(
        window,
        "__NEXT_DEVTOOLS_AUTO_ROOT__",
      ),
    ),
  ).resolves.toBe(false);
});
