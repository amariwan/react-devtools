import { test, expect } from "@playwright/test";

test("devtools launcher visible in dev mode", async ({ page }) => {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Open Next.js DevTools" });
  await expect(launcher).toBeVisible();
});

test("overview panel opens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await expect(page.getByText("Overview")).toBeVisible();
});

test("pages panel searches and navigates discovered routes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("tab", { name: "Pages" }).click();
  await expect(
    page.getByRole("heading", { name: "Pages / Router" }),
  ).toBeVisible();
  const search = page.getByRole("textbox", { name: "Route search" });
  await search.fill("dashboard");
  const dashboardRow = page.locator("li").filter({
    has: page.getByText("/dashboard", { exact: true }),
  });
  await expect(dashboardRow).toBeVisible();
  await dashboardRow.getByRole("button", { name: "Navigate" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await search.fill("dashboard/[id]");
  const dynamicRow = page.locator("li").filter({
    has: page.getByText("/dashboard/[id]", { exact: true }),
  });
  const parameter = dynamicRow.getByRole("textbox", {
    name: "Route parameter id for /dashboard/[id]",
  });
  await parameter.fill("42");
  await dynamicRow.getByRole("button", { name: "Navigate" }).click();
  await expect(page).toHaveURL(/\/dashboard\/42$/);

  await search.fill("docs/[...slug]");
  const optionalCatchAllRow = page.locator("li").filter({
    has: page.getByText("/docs/[...slug]", { exact: true }),
  });
  await expect(
    optionalCatchAllRow.getByRole("button", { name: "Navigate" }),
  ).toBeEnabled();
  await optionalCatchAllRow.getByRole("button", { name: "Navigate" }).click();
  await expect(page).toHaveURL(/\/docs$/);
});

test("overview health refreshes after a runtime diagnostic", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  const panel = page.getByRole("tabpanel");
  const diagnostics = panel.getByText(/Diagnostics: \d+ captured/);
  const before = Number((await diagnostics.textContent())?.match(/\d+/)?.[0]);

  await page.evaluate(() => {
    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "overview health refresh",
        error: new Error("overview health refresh"),
      }),
    );
  });

  await expect
    .poll(async () =>
      Number((await diagnostics.textContent())?.match(/\d+/)?.[0]),
    )
    .toBeGreaterThan(before);
});

test("timeline panel opens and records runtime events", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(
    page.getByRole("tabpanel").getByRole("heading", { name: "Timeline" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tabpanel").getByText(/recording · \d+ events/),
  ).toBeVisible();
  await expect(
    page.getByRole("tabpanel").getByText("react-render · commit").first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Timeline layer filter" })
    .selectOption("navigation");
  await page.evaluate(() => history.pushState({}, "", "/dashboard"));
  await expect(
    page.getByRole("tabpanel").getByText("navigation · navigation").first(),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Timeline layer filter" })
    .selectOption("");
  const timelinePanel = page.getByRole("tabpanel");
  await timelinePanel
    .getByRole("button", { name: "Capture debug session" })
    .click();
  await expect(timelinePanel).toContainText("1 debug session captured");
  await page.evaluate(() => history.pushState({}, "", "/dashboard/2"));
  await timelinePanel
    .getByRole("button", { name: "Capture debug session" })
    .click();
  await expect(timelinePanel).toContainText("2 debug sessions captured");
  await expect(timelinePanel).toContainText("Debug session comparison:");
  await page.reload();
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "2 debug sessions captured",
  );
});

test("timeline can share bounded sessions across tabs when enabled", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("tab", { name: "Timeline" }).click();
  const firstPanel = page.getByRole("tabpanel");
  await firstPanel.getByLabel("Share across tabs").check();

  const secondPage = await context.newPage();
  try {
    await secondPage.goto("/");
    await secondPage
      .getByRole("button", { name: "Open Next.js DevTools" })
      .click();
    await secondPage.getByRole("tab", { name: "Timeline" }).click();
    const secondPanel = secondPage.getByRole("tabpanel");
    await expect(secondPanel.getByLabel("Share across tabs")).toBeChecked();

    await firstPanel
      .getByRole("button", { name: "Capture debug session" })
      .click();
    await expect(secondPanel).toContainText("1 debug session captured");
  } finally {
    await secondPage.close();
  }
});

test("command palette searches and selects a panel by keyboard", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page
    .getByRole("button", { name: "Search panels and commands" })
    .click();

  const palette = page.getByRole("dialog", { name: "Command palette" });
  const input = palette.getByPlaceholder("Search panels and commands…");
  await input.fill("network");
  await expect(
    palette.getByRole("button", { name: "panel Network" }),
  ).toBeVisible();
  await input.press("Enter");

  await expect(
    page.getByRole("tabpanel").getByRole("heading", { name: "Network" }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toHaveCount(0);
});

test("command palette searches bounded runtime evidence", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(
    page.getByRole("tabpanel").getByRole("heading", { name: "Timeline" }),
  ).toBeVisible();
  await page.evaluate(() => history.pushState({}, "", "/dashboard"));
  await expect(
    page.getByRole("tabpanel").getByText("navigation · navigation").first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Search panels and commands" })
    .click();

  const palette = page.getByRole("dialog", { name: "Command palette" });
  const input = palette.getByPlaceholder("Search panels and commands…");
  await input.fill("navigation");
  await expect(
    palette.getByRole("button", { name: /navigation · navigation/ }).first(),
  ).toBeVisible();
  await input.press("Enter");
  await expect(
    page.getByRole("tabpanel").getByRole("heading", { name: "Timeline" }),
  ).toBeVisible();
});

test("network panel exposes bounded recording, filtering, and export controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("tab", { name: "Network" }).click();

  const panel = page.getByRole("tabpanel");
  await expect(panel.getByRole("heading", { name: "Network" })).toBeVisible();
  await expect(
    panel.getByRole("textbox", { name: "Network request search" }),
  ).toBeVisible();
  await expect(
    panel.getByRole("combobox", { name: "Network initiator filter" }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Start recording" }),
  ).toBeVisible();
  await expect(
    panel.getByRole("button", { name: "Export JSON" }),
  ).toBeVisible();

  await panel
    .getByRole("textbox", { name: "Network request search" })
    .fill("definitely-not-a-captured-request");
  await expect(panel.getByText("No matching network entries")).toBeVisible();
});

test("settings activates the on-demand Agent / MCP plugin", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Optional plugins")).toBeVisible();
  await page.getByRole("button", { name: "Activate" }).click();
  await expect(page.getByRole("button", { name: "Active" })).toBeVisible();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("tab", { name: "Agent / MCP" })).toBeVisible();
  await page.getByRole("tab", { name: "Agent / MCP" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Read-only tools:");
  await page.evaluate(() => {
    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "browser diagnostic smoke",
        error: new Error("browser diagnostic smoke"),
      }),
    );
  });
  await expect(page.getByRole("tabpanel")).toContainText(
    "browser diagnostic smoke",
  );
  await expect(page.getByRole("tabpanel")).toContainText(
    /Unmapped stack frame:|Source location unavailable/,
  );
});
