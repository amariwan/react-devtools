import { test, expect } from "@playwright/test";

test("pick element resolves a component and shows source", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByLabel("Components").click();
  await expect(page.getByLabel("Suspense diagnostics")).toContainText(
    /Suspense boundaries: \d+/,
  );
  const tree = page.getByRole("tree", { name: "React component tree" });
  await expect(tree).toBeVisible();
  const firstTreeItem = tree.getByRole("treeitem").first();
  await expect(firstTreeItem).toBeVisible();
  await expect(firstTreeItem).toHaveAttribute("aria-setsize", /\d+/);
  await expect(tree).toHaveCSS("max-height", "420px");
  await firstTreeItem.focus();
  await firstTreeItem.press("ArrowDown");
  await expect(tree.getByRole("treeitem").nth(1)).toBeFocused();
  await tree.getByRole("treeitem").nth(1).press("Home");
  await expect(firstTreeItem).toBeFocused();
  await page.getByText("Pick element").click();
  // Pick the first button in the page (the counter increment button).
  const target = page.locator('button[aria-label="increment counter"]').first();
  await target.evaluate((element) => {
    element.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
    );
  });
  await expect(page.getByText(/Source:/)).toBeVisible();
  await expect(
    page.locator('[data-next-devtools-highlight="selected"]'),
  ).toHaveCount(1);
  expect(
    consoleErrors.filter((message) =>
      message.includes("Maximum update depth exceeded"),
    ),
  ).toEqual([]);
});

test("selected component persists when switching panels", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByLabel("Components").click();
  const tree = page.getByRole("tree", { name: "React component tree" });
  await expect(tree.getByRole("treeitem").nth(1)).toBeVisible();
  await tree.getByRole("treeitem").nth(1).click();
  await expect(page.getByText(/Source:/)).toBeVisible();

  await page.getByLabel("Timeline").click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
  await page.getByLabel("Components").click();
  await expect(page.getByText(/Source:/)).toBeVisible();
});
