import { expect, test } from "@playwright/test";

test("devtools launcher visible in dev mode", async ({ page }) => {
	await page.goto("/");
	const launcher = page.getByRole("button", { name: "Open Next.js DevTools" });
	await expect(launcher).toBeVisible();
});

test("dock respects reduced motion", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	const dock = page.locator('[data-dock="bottom"]');
	await expect(dock).toBeVisible();
	await expect(dock).toHaveCSS("animation-name", "none");
	await expect(dock).toHaveCSS("transition-duration", "0s");
});

test("overview bento shows live status and fits a compact dock", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Overview" }).click();
	await page.setViewportSize({ width: 440, height: 956 });
	const panel = page.getByRole("tabpanel");
	await expect(
		panel.getByRole("heading", { name: "Your app, in focus." }),
	).toBeVisible();
	await expect(
		panel.getByRole("heading", { name: "Trace the important moments" }),
	).toBeVisible();
	await expect(
		panel.getByText("No recent diagnostics", { exact: true }),
	).toBeVisible();
	await expect(
		panel.getByText("diagnostics captured", { exact: true }),
	).toBeVisible();
	await panel.getByRole("searchbox", { name: "Search panels" }).fill("comp");
	await expect(
		panel.getByRole("button", { name: "Components", exact: true }),
	).toBeVisible();
	await expect(
		panel.getByRole("button", { name: "Pages", exact: true }),
	).toHaveCount(0);
	await page.screenshot({
		path: "/tmp/react-devtools-after/overview-compact-final.png",
		fullPage: true,
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	const switchToLight = page.getByRole("button", {
		name: "Switch to light theme",
	});
	await expect(switchToLight).toBeVisible();
	await expect
		.poll(() =>
			switchToLight.evaluate((button) => getComputedStyle(button).color),
		)
		.toBe("rgb(228, 228, 231)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/overview-compact-final-dark.png",
		fullPage: true,
	});
});

test("timeline debug-session actions use accessible icon buttons", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Timeline" }).click();
	const panel = page.getByRole("tabpanel");
	const startRecording = panel.getByRole("button", { name: "Start recording" });
	await expect(startRecording.locator("svg")).toBeVisible();
	const captureBaseline = panel.getByRole("button", {
		name: "Capture profiler baseline",
	});
	await expect(captureBaseline.locator("svg")).toBeVisible();
	const capture = panel.getByRole("button", { name: "Capture debug session" });
	await expect(capture.locator("svg")).toBeVisible();
	await expect(
		panel.getByRole("button", { name: "Export latest session" }),
	).toBeDisabled();
	await expect(
		panel.getByRole("button", {
			name: "Runtime events come from registered DevTools layers. React commit profiling is not inferred from this stream.",
		}),
	).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/timeline-icons.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	const switchToLight = page.getByRole("button", {
		name: "Switch to light theme",
	});
	await expect(switchToLight).toBeVisible();
	await expect
		.poll(() =>
			switchToLight.evaluate((element) => getComputedStyle(element).color),
		)
		.toBe("rgb(228, 228, 231)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/timeline-icons-dark.png",
		animations: "disabled",
	});
	await page.setViewportSize({ width: 440, height: 956 });
	const controlNames = [
		"Start recording",
		"Stop recording",
		"Clear timeline events",
		"Capture profiler baseline",
	];
	const controlBounds = await Promise.all(
		controlNames.map((name) =>
			panel.getByRole("button", { name }).boundingBox(),
		),
	);
	if (controlBounds.some((bounds) => bounds === null)) {
		throw new Error("Timeline controls are not all rendered");
	}
	const controlRows = controlBounds.map((bounds) => bounds?.y ?? 0);
	expect(Math.max(...controlRows) - Math.min(...controlRows)).toBeLessThan(4);
	await page.screenshot({
		path: "/tmp/react-devtools-after/timeline-compact-dark.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to light theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/timeline-compact-light.png",
		animations: "disabled",
	});
});

test("overview settings link opens settings", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	const panel = page.getByRole("tabpanel");
	await expect(panel.getByText("Current page")).toBeVisible();
	await panel.getByText("Project links and settings").click();
	await panel.getByRole("button", { name: "Settings" }).click();
	const settings = page.getByRole("region", { name: "Settings" });
	await expect(settings).toBeVisible();
	await page.setViewportSize({ width: 320, height: 700 });
	await page
		.getByRole("combobox", { name: "DevTools panel" })
		.selectOption("settings");
	await page.screenshot({
		path: "/tmp/react-devtools-after/settings-320-top-light.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/settings-320-top-dark.png",
		animations: "disabled",
	});
});

test("bottom launcher leaves compact settings actions clear", async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 700 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page
		.getByRole("combobox", { name: "DevTools panel" })
		.selectOption("settings");

	const settings = page.getByRole("region", { name: "Settings" });
	const activateAgentMcp = settings.getByRole("button", {
		name: "Activate Agent / MCP",
	});
	await activateAgentMcp.waitFor();
	await settings
		.locator('[data-slot="panel-content"]')
		.evaluate((element) => element.scrollTo(0, element.scrollHeight));
	const launcher = page.getByRole("button", { name: "Open Next.js DevTools" });
	const [actionBounds, launcherBounds] = await Promise.all([
		activateAgentMcp.boundingBox(),
		launcher.boundingBox(),
	]);
	if (!actionBounds || !launcherBounds) {
		throw new Error("Settings action or bottom launcher is not rendered");
	}
	expect(
		launcherBounds.y - (actionBounds.y + actionBounds.height),
	).toBeGreaterThanOrEqual(32);
	await page.screenshot({
		path: "/tmp/react-devtools-after/settings-320-launcher-clearance.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/settings-320-launcher-clearance-dark.png",
		animations: "disabled",
	});
});

test("desktop bottom dock stays compact and centered", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	const dock = page.getByRole("region", { name: "Next.js DevTools" });
	const bounds = await dock.boundingBox();
	if (!bounds) throw new Error("DevTools dock is not rendered");
	expect(bounds.width).toBeLessThanOrEqual(560);
	expect(bounds.width).toBeGreaterThan(550);
	expect(bounds.x).toBeCloseTo((1440 - bounds.width) / 2, 0);
	await page.screenshot({
		path: "/tmp/react-devtools-after/dock-1440-narrowed.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await expect(
		page.getByRole("button", { name: "Switch to light theme" }),
	).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/dock-1440-narrowed-dark.png",
		animations: "disabled",
	});
});

test("bottom dock resizes from the keyboard with announced bounds", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();

	const dock = page.getByRole("region", { name: "Next.js DevTools" });
	const resize = dock.getByRole("separator", { name: "Resize DevTools" });
	const initialBounds = await dock.boundingBox();
	if (!initialBounds) throw new Error("DevTools dock is not rendered");

	await resize.focus();
	await expect(resize).toHaveAttribute("aria-valuenow", "72");
	await page.keyboard.press("ArrowUp");
	await expect(resize).toHaveAttribute("aria-valuenow", "77");
	await expect
		.poll(async () => (await dock.boundingBox())?.height)
		.toBeGreaterThan(initialBounds.height);

	await page.keyboard.press("Home");
	await expect(resize).toHaveAttribute("aria-valuenow", "35");
	await page.keyboard.press("End");
	await expect(resize).toHaveAttribute("aria-valuenow", "94");
});

test("mobile panels open and show navigation", async ({ page }) => {
	await page.setViewportSize({ width: 440, height: 956 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	const navigation = page.getByRole("combobox", { name: "DevTools panel" });
	await expect(navigation).toBeVisible();
	await navigation.selectOption("pages");
	await expect(
		page.getByRole("tabpanel").getByRole("heading", { name: "Pages / Router" }),
	).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/pages-compact-active-route.png",
		animations: "disabled",
	});
	await navigation.selectOption("settings");
	const settings = page.getByRole("region", { name: "Settings" });
	await expect(settings).toBeVisible();
	await expect(
		settings.evaluate((element) => element.scrollWidth <= element.clientWidth),
	).resolves.toBe(true);
});

test("pages panel searches and navigates discovered routes", async ({
	page,
}) => {
	const insertionEffectWarnings: string[] = [];
	page.on("console", (message) => {
		if (
			message.type() === "error" &&
			message.text().includes("useInsertionEffect must not schedule updates")
		) {
			insertionEffectWarnings.push(message.text());
		}
	});
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
	const navigate = dashboardRow.getByRole("button", { name: "Navigate" });
	await expect(navigate.locator("svg")).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/pages-route-icons.png",
		animations: "disabled",
	});
	await navigate.click();
	await expect(page).toHaveURL(/\/dashboard$/);

	await search.fill("dashboard/[id]");
	const dynamicRow = page.locator("li").filter({
		has: page.getByRole("textbox", {
			name: "Route parameter id for /dashboard/[id]",
		}),
	});
	const parameter = dynamicRow.getByRole("textbox", {
		name: "Route parameter id for /dashboard/[id]",
	});
	await parameter.fill("42");
	await dynamicRow.getByRole("button", { name: "Navigate" }).click();
	await expect(page).toHaveURL(/\/dashboard\/42$/);
	await expect(dynamicRow).toHaveAttribute("aria-current", "page");
	await page.screenshot({
		path: "/tmp/react-devtools-after/pages-dynamic-route-active.png",
		animations: "disabled",
	});
	await page.setViewportSize({ width: 440, height: 956 });
	await expect(
		page.getByRole("combobox", { name: "DevTools panel" }),
	).toHaveValue("pages");
	await expect(
		page
			.getByRole("tabpanel")
			.evaluate((panel) => panel.scrollWidth <= panel.clientWidth),
	).resolves.toBe(true);
	await page.screenshot({
		path: "/tmp/react-devtools-after/pages-compact-current-light.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	const switchToLight = page.getByRole("button", {
		name: "Switch to light theme",
	});
	await expect
		.poll(() =>
			switchToLight.evaluate((button) => getComputedStyle(button).color),
		)
		.toBe("rgb(228, 228, 231)");
	await page.screenshot({
		path: "/tmp/react-devtools-after/pages-compact-current-dark.png",
		animations: "disabled",
	});
	expect(insertionEffectWarnings).toEqual([]);

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
	const diagnostics = panel.getByTestId("overview-diagnostic-count");
	const before = Number(await diagnostics.textContent());

	await page.evaluate(() => {
		window.dispatchEvent(
			new ErrorEvent("error", {
				message: "overview health refresh",
				error: new Error("overview health refresh"),
			}),
		);
	});

	await expect
		.poll(async () => Number(await diagnostics.textContent()))
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
		page.getByRole("tabpanel").getByText(/recording · \d+ events/i),
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

test("timeline loads older events in bounded batches", async ({ page }) => {
	await page.goto("/");
	await page.evaluate(() => {
		for (let index = 0; index < 180; index++) {
			history.pushState({}, "", `/?timeline-event=${index}`);
		}
	});
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Timeline" }).click();
	const panel = page.getByRole("tabpanel");
	await expect(panel.getByRole("list").getByRole("listitem")).toHaveCount(101);
	await panel
		.getByRole("button", { name: "Load 100 older timeline events" })
		.click();
	await expect(panel.getByRole("list").getByRole("listitem")).toHaveCount(201);
	await expect(
		panel.getByRole("button", { name: /Load \d+ older timeline events/ }),
	).toBeVisible();
	const eventRegion = panel.getByRole("region", { name: "Timeline events" });
	const listMetrics = await eventRegion.evaluate((region) => ({
		clientHeight: region.clientHeight,
		scrollHeight: region.scrollHeight,
		firstRowHeight:
			region.querySelector("li")?.getBoundingClientRect().height ?? 0,
	}));
	expect(listMetrics.firstRowHeight).toBeGreaterThan(20);
	expect(listMetrics.scrollHeight).toBeGreaterThan(listMetrics.clientHeight);
	await eventRegion.focus();
	expect(
		await eventRegion.evaluate(
			(region) => region.getRootNode().activeElement === region,
		),
	).toBe(true);
	await page.screenshot({
		path: "/tmp/react-devtools-after/timeline-load-older.png",
		animations: "disabled",
	});
});

test("timeline can share bounded sessions across tabs when enabled", async ({
	page,
	context,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Timeline" }).click();
	const firstPanel = page.getByRole("tabpanel");
	await firstPanel.getByRole("checkbox", { name: "Share across tabs" }).check();

	const secondPage = await context.newPage();
	try {
		await secondPage.goto("/");
		await secondPage
			.getByRole("button", { name: "Open Next.js DevTools" })
			.click();
		await secondPage.getByRole("tab", { name: "Timeline" }).click();
		const secondPanel = secondPage.getByRole("tabpanel");
		await expect(
			secondPanel.getByRole("checkbox", { name: "Share across tabs" }),
		).toBeChecked();

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
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	const dock = page.getByRole("region", { name: "Next.js DevTools" });
	await expect(dock).toHaveAttribute("data-dock", "bottom");
	await expect(dock).toHaveCSS("animation-name", "devtools-dock-enter-bottom");
	await dock.evaluate(async (element) => {
		await Promise.all(
			element.getAnimations().map((animation) => animation.finished),
		);
	});
	const dockBounds = await dock.boundingBox();
	if (!dockBounds) throw new Error("DevTools dock is not rendered");
	expect(dockBounds.x + dockBounds.width / 2).toBeCloseTo(640, 0);
	expect(dockBounds.width).toBeGreaterThan(530);
	expect(dockBounds.width).toBeLessThanOrEqual(538);
	await page.screenshot({
		path: "/tmp/react-devtools-after/dock-bottom-center-narrowed.png",
		animations: "disabled",
	});

	await page.setViewportSize({ width: 440, height: 900 });
	const compactBounds = await dock.boundingBox();
	if (!compactBounds) throw new Error("Compact DevTools dock is not rendered");
	expect(compactBounds.x + compactBounds.width / 2).toBeCloseTo(220, 0);
	expect(compactBounds.width).toBeCloseTo(280, 0);
	await page.screenshot({
		path: "/tmp/react-devtools-after/dock-bottom-center-narrowed-compact.png",
		animations: "disabled",
	});

	await page.setViewportSize({ width: 320, height: 800 });
	const narrowBounds = await dock.boundingBox();
	if (!narrowBounds) throw new Error("Narrow DevTools dock is not rendered");
	expect(narrowBounds.width).toBeCloseTo(280, 0);
	expect(narrowBounds.x + narrowBounds.width / 2).toBeCloseTo(160, 0);
	await page.screenshot({
		path: "/tmp/react-devtools-after/dock-bottom-center-narrow.png",
		animations: "disabled",
	});
	await page.setViewportSize({ width: 440, height: 900 });
	await page
		.getByRole("button", { name: "Search panels and commands" })
		.click();

	const palette = page.getByRole("dialog", { name: "Search DevTools" });
	await expect(palette).toHaveCSS("animation-name", "devtools-popover-enter");
	const input = palette.getByRole("combobox", {
		name: "Search panels and commands",
	});
	await input.fill("network");
	await expect(
		palette.getByRole("option", { name: "Panel Network" }),
	).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/command-palette-compact.png",
		animations: "disabled",
	});
	await input.press("Escape");
	await expect(
		page.getByRole("dialog", { name: "Search DevTools" }),
	).toHaveCount(0);
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await expect(
		page.getByRole("button", { name: "Switch to light theme" }),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Search panels and commands" })
		.click();
	const darkPalette = page.getByRole("dialog", { name: "Search DevTools" });
	const darkInput = darkPalette.getByRole("combobox", {
		name: "Search panels and commands",
	});
	await darkInput.fill("network");
	await expect(
		darkPalette.getByRole("option", { name: "Panel Network" }),
	).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/command-palette-compact-dark.png",
		animations: "disabled",
	});
	await darkInput.press("Enter");

	await expect(
		page.getByRole("tabpanel").getByRole("heading", { name: "Network" }),
	).toBeVisible();
	await page.keyboard.press("Control+k");
	await expect(
		page.getByRole("dialog", { name: "Search DevTools" }),
	).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(
		page.getByRole("dialog", { name: "Search DevTools" }),
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

	const palette = page.getByRole("dialog", { name: "Search DevTools" });
	const input = palette.getByRole("combobox", {
		name: "Search panels and commands",
	});
	await input.fill("navigation");
	await expect(input).toHaveValue("navigation");
	await page.waitForTimeout(200);
	await expect(
		palette.getByRole("option", { name: /navigation · navigation/ }).first(),
	).toBeVisible({ timeout: 30000 });
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
		panel.getByRole("button", { name: /^(Start|Stop) recording$/ }),
	).toBeVisible();
	await expect(
		panel.getByRole("button", { name: "Export JSON" }),
	).toBeVisible();

	await panel
		.getByRole("textbox", { name: "Network request search" })
		.fill("definitely-not-a-captured-request");
	await expect(panel.getByText("No matching requests")).toBeVisible();
});

test("settings activates the on-demand Agent / MCP plugin", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("button", { name: "Settings", exact: true }).click();
	await expect(page.getByText("Optional plugins")).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/settings-plugin-icons.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Activate Agent / MCP" }).click();
	await expect(
		page.getByRole("button", { name: "Agent / MCP active" }),
	).toBeVisible();
	await page.getByRole("button", { name: "Settings", exact: true }).click();
	await expect(page.getByRole("tab", { name: "Agent / MCP" })).toBeVisible();
	await page.setViewportSize({ width: 440, height: 900 });
	await page
		.getByRole("combobox", { name: "DevTools panel" })
		.selectOption("agent-mcp");
	const agentPanel = page.getByRole("tabpanel");
	await expect(agentPanel).toContainText("Read-only tools");
	await expect(
		agentPanel.getByText("No errors", { exact: true }),
	).toBeVisible();
	const serviceList = agentPanel.getByRole("list", {
		name: "Runtime service status",
	});
	await expect(serviceList).toBeVisible();
	await expect(
		agentPanel.getByText("7 services available", { exact: true }),
	).toBeVisible();
	await expect(agentPanel.getByText("No additional details")).toHaveCount(0);
	await expect(
		agentPanel.getByRole("button", {
			name: "MCP transport is not enabled by this panel.",
		}),
	).toHaveAttribute("title", "MCP transport is not enabled by this panel.");
	const reactService = serviceList.locator(
		'code[title="next-devtools.runtime.react"]',
	);
	await expect(reactService).toBeVisible();
	await expect(reactService).toHaveAttribute(
		"title",
		"next-devtools.runtime.react",
	);
	await expect(serviceList.getByText("available", { exact: true })).toHaveCount(
		7,
	);
	await expect(
		agentPanel.getByRole("list", { name: "Plugin status" }),
	).toBeVisible();
	await expect
		.poll(() =>
			agentPanel.evaluate(
				(element) => element.scrollWidth <= element.clientWidth,
			),
		)
		.toBe(true);
	await page.screenshot({
		path: "/tmp/react-devtools-after/agent-mcp-compact.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/agent-mcp-compact-dark.png",
		animations: "disabled",
	});
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
		/Unmapped:|Source location unavailable/,
	);
});

test("settings exposes reference tab groups, pinning, and update highlighting", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("button", { name: "Settings", exact: true }).click();

	const settings = page.getByRole("region", { name: "Settings" });
	await expect(settings.getByRole("heading", { name: "Tabs" })).toBeVisible();
	await expect(settings.getByText("app", { exact: true })).toBeVisible();
	await expect(
		settings.getByRole("switch", { name: "Toggle app tabs" }),
	).toHaveAttribute("aria-checked", "true");

	await settings.getByRole("button", { name: "Pin Components" }).click();
	await expect(
		settings.getByRole("button", { name: "Unpin Components" }),
	).toBeVisible();
	await expect(
		settings.getByRole("button", { name: "Move Components pinned tab down" }),
	).toBeVisible();

	const highlight = settings.getByRole("switch", {
		name: "Highlight component updates",
	});
	await highlight.click();
	await expect(highlight).toHaveAttribute("aria-checked", "true");

	await settings.getByRole("switch", { name: "Toggle app tabs" }).click();
	await expect(
		settings.getByRole("switch", { name: "Toggle app tabs" }),
	).toHaveAttribute("aria-checked", "false");
	// Pinned tabs stay available when their source category is hidden.
	await expect(page.getByRole("tab", { name: "Components" })).toBeVisible();
});

test("showcase custom inspector registers and updates its setting", async ({
	page,
}) => {
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();
	await page.getByRole("tab", { name: "Showcase Custom" }).click();

	const panel = page.getByRole("tabpanel", { name: "Showcase Custom" });
	const greeting = panel.getByRole("textbox", { name: "Greeting" });
	await expect(greeting).toHaveValue("Hello");
	await expect(panel.getByText("Hello, world!")).toBeVisible();

	await greeting.fill("Hola");
	await expect(panel.getByText("Hola, world!")).toBeVisible();
	await page.screenshot({
		path: "/tmp/react-devtools-after/custom-inspector-desktop-light.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/custom-inspector-desktop-dark.png",
		animations: "disabled",
	});
	await page.getByRole("tab", { name: "Overview" }).click();
	await page.getByRole("tab", { name: "Showcase Custom" }).click();
	await expect(
		page
			.getByRole("tabpanel", { name: "Showcase Custom" })
			.getByRole("textbox", { name: "Greeting" }),
	).toHaveValue("Hola");
	await page.getByRole("button", { name: "Switch to light theme" }).click();
	await page.setViewportSize({ width: 440, height: 900 });
	await page
		.getByRole("combobox", { name: "DevTools panel" })
		.selectOption("showcase-custom");
	const compactPanel = page.getByRole("tabpanel", { name: "Showcase Custom" });
	await expect(compactPanel.getByText("Hola, world!")).toBeVisible();
	await expect
		.poll(() =>
			compactPanel.evaluate(
				(element) => element.scrollWidth <= element.clientWidth,
			),
		)
		.toBe(true);
	await page.screenshot({
		path: "/tmp/react-devtools-after/custom-inspector-compact-light.png",
		animations: "disabled",
	});
	await page.getByRole("button", { name: "Switch to dark theme" }).click();
	await page.screenshot({
		path: "/tmp/react-devtools-after/custom-inspector-compact-dark.png",
		animations: "disabled",
	});
});

test("desktop icon rail exposes names and supports arrow-key navigation", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto("/");
	await page.getByRole("button", { name: "Open Next.js DevTools" }).click();

	const overview = page.getByRole("tab", { name: "Overview" });
	const components = page.getByRole("tab", { name: "Components" });
	await expect(overview).toBeFocused();
	await expect(overview).toHaveAttribute("aria-label", "Overview");
	await expect(overview.locator("svg")).toBeVisible();
	await page.keyboard.press("ArrowDown");
	await expect(components).toHaveAttribute("aria-selected", "true");
	await expect(components).toBeFocused();
});
