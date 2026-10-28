import { test, expect } from "@playwright/test";

test("state panels bridge compatible read-only store globals", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const globals = window as unknown as Record<string, unknown>;
    globals.__ZUSTAND_STORES__ = [
      {
        id: "e2e",
        label: "E2E Zustand",
        getState: () => ({ count: 3 }),
        subscribe: () => () => undefined,
      },
    ];
    globals.__REDUX_STORE__ = {
      getState: () => ({ user: { id: 1 } }),
      subscribe: () => () => undefined,
    };
    globals.__TANSTACK_QUERY_CLIENT__ = {
      getQueryCache: () => ({
        getAll: () => [
          {
            queryKey: ["e2e"],
            state: { status: "success", fetchStatus: "idle", data: [1] },
          },
        ],
        subscribe: () => () => undefined,
      }),
    };
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Open Next.js DevTools" }).click();

  await page.getByRole("tab", { name: "Zustand" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("E2E Zustand");
  await page
    .getByRole("combobox", { name: "Store adapter" })
    .selectOption("zustand:e2e");
  await expect(page.getByRole("tabpanel")).toContainText("object: {1}");
  await expect(page.getByLabel("Store value")).toContainText("count:");
  await expect(page.getByLabel("Store value")).toContainText("3");

  await page.getByRole("tab", { name: "Redux" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Redux store");
  await page
    .getByRole("combobox", { name: "Store adapter" })
    .selectOption("redux:default");
  await expect(page.getByRole("tabpanel")).toContainText("object: {1}");
  await expect(page.getByLabel("Store value")).toContainText("user:");
  await expect(page.getByLabel("Store value")).toContainText("id:");

  await page.getByRole("tab", { name: "TanStack Query" }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "TanStack Query cache",
  );
  await page
    .getByRole("combobox", { name: "Store adapter" })
    .selectOption("tanstack-query:default");
  await expect(page.getByRole("tabpanel")).toContainText("array: Array(1)");
});
