import { expect, test } from "@playwright/test";

test("state panels bridge compatible read-only store globals", async ({
	page,
}) => {
	await page.addInitScript(() => {
		const globals = window as unknown as Record<string, unknown>;
		globals.__ZUSTAND_STORES__ = [
			{
				id: "e2e",
				label: "E2E Zustand",
				getState: () => ({
					count: 3,
					extremelyLongPropertyName: "a-long-debug-value",
				}),
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
	await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();

	await page.getByRole("tab", { name: "Zustand" }).click();
	await expect(page.getByRole("tabpanel")).toContainText("E2E Zustand");
	await expect(page.getByText("1 adapter", { exact: true })).toBeVisible();
	await page
		.getByRole("combobox", { name: "Store adapter" })
		.selectOption("zustand:e2e");
	const storeValue = page.getByRole("region", { name: "Store value" });
	await expect(storeValue).toContainText("count:");
	await expect(storeValue).toContainText("3");
	await expect(page.getByText(/Global stores detected/)).toHaveCount(0);
	await page
		.getByRole("button", {
			name: "Copy JSON at $.count",
		})
		.click();
	await expect(page.getByRole("status")).toHaveText("Copied JSON at $.count.");
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("3");
	await page.screenshot({
		path: "/tmp/react-devtools-after/store-inspector-copy.png",
		fullPage: true,
	});
	await page.setViewportSize({ width: 440, height: 956 });
	await page.screenshot({
		path: "/tmp/react-devtools-after/store-inspector-copy-compact-light.png",
		fullPage: true,
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	const switchToLight = page.getByRole("button", {
		name: "Switch to light theme",
	});
	await expect
		.poll(() =>
			switchToLight.evaluate((element) => getComputedStyle(element).color),
		)
		.toBe("rgb(228, 228, 231)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/store-inspector-copy-dark.png",
		fullPage: true,
	});
	const panelWidth = await page.getByRole("tabpanel").evaluate((panel) => ({
		client: panel.clientWidth,
		scroll: panel.scrollWidth,
	}));
	expect(panelWidth.scroll).toBeLessThanOrEqual(panelWidth.client);
	await page.screenshot({
		path: "/tmp/react-devtools-after/store-inspector-copy-compact.png",
		fullPage: true,
	});
	await page
		.getByRole("textbox", { name: "Filter store properties" })
		.fill("extremelyLong");
	await expect(storeValue).toContainText("extremelyLongPropertyName:");
	await expect(storeValue).toContainText('"a-long-debug-value"');
	await page.screenshot({
		path: "/tmp/react-devtools-after/store-inspector-filtered-compact.png",
		fullPage: true,
	});
	await page.setViewportSize({ width: 1280, height: 800 });

	await page.getByRole("tab", { name: "Redux" }).click();
	await expect(page.getByRole("tabpanel")).toContainText("Redux store");
	await expect(page.getByText("1 adapter", { exact: true })).toBeVisible();
	await page
		.getByRole("combobox", { name: "Store adapter" })
		.selectOption("redux:default");
	const reduxValue = page.getByRole("region", { name: "Store value" });
	await expect(reduxValue).toContainText("user:");
	await reduxValue
		.getByText("user:", { exact: true })
		.locator("..")
		.locator("summary")
		.click();
	await expect(reduxValue).toContainText("id:");
	await page.screenshot({
		path: "/tmp/react-devtools-after/redux-dark.png",
		fullPage: true,
	});
	await page.setViewportSize({ width: 440, height: 956 });
	await page.screenshot({
		path: "/tmp/react-devtools-after/redux-compact-dark.png",
		fullPage: true,
	});
	await page.setViewportSize({ width: 1280, height: 800 });

	await page.getByRole("tab", { name: "TanStack Query" }).click();
	await expect(page.getByRole("tabpanel")).toContainText(
		"TanStack Query cache",
	);
	await expect(page.getByText("1 adapter", { exact: true })).toBeVisible();
	await page
		.getByRole("combobox", { name: "Store adapter" })
		.selectOption("tanstack-query:default");
	const queryValue = page.getByRole("region", { name: "Store value" });
	await expect(queryValue).toContainText("Array(1)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/tanstack-query-dark.png",
		fullPage: true,
	});
	await page.setViewportSize({ width: 440, height: 956 });
	await page.screenshot({
		path: "/tmp/react-devtools-after/tanstack-query-compact-dark.png",
		fullPage: true,
	});
});
