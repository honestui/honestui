import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const revenueLabel =
  "Sample monthly revenue. January to September are measured, October is provisional, and November and December are forecast.";

test("data status key names the statuses and range in the revenue chart", async ({ page }) => {
  await page.goto("/docs/charts/data-status");

  const chart = page.locator("[data-chart]").filter({ has: page.getByRole("img", { name: revenueLabel }) });
  const key = chart.getByRole("list", { name: "Data status" });

  await expect(key.getByRole("listitem")).toHaveText([
    /^Measured/,
    /^Provisional/,
    /^Forecast/,
    /^Range/,
  ]);
  await expect(key.getByRole("listitem").filter({ hasText: "Forecast" })).toContainText(
    "A projection for a period that has not been recorded yet.",
  );
});

test("data status tooltip explains a forecast value and its range", async ({ page }) => {
  await page.goto("/docs/charts/data-status");

  const chart = page.locator("[data-chart]").filter({ has: page.getByRole("img", { name: revenueLabel }) });
  const canvas = chart.locator("canvas").first();
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("The revenue chart canvas has no layout box.");

  // November is the eleventh of twelve evenly spaced points.
  await page.mouse.move(box.x + box.width * 0.92, box.y + box.height * 0.5);

  await expect(chart.getByText("Forecast · Range 398 – 471")).toBeVisible();
  await expect(
    chart.getByText("A projection for a period that has not been recorded yet.").last(),
  ).toBeVisible();
});

test("pie and scatter keys say which missing values could not be drawn", async ({ page }) => {
  await page.goto("/docs/charts/data-status");

  const keys = page.getByRole("list", { name: "Data status" });

  // Previews mount when they scroll into view.
  await page.getByRole("heading", { name: "Pie", exact: true }).scrollIntoViewIfNeeded();
  await expect(keys.getByRole("listitem").filter({ hasText: "Missing: Social" })).toBeVisible();

  await page.getByRole("heading", { name: "Scatter", exact: true }).scrollIntoViewIfNeeded();
  await expect(keys.getByRole("listitem").filter({ hasText: "Missing: 1 not shown" })).toBeVisible();
});

test("heatmap key lists every status drawn on its cells", async ({ page }) => {
  await page.goto("/docs/charts/data-status");

  await page.getByRole("heading", { name: "Heatmap", exact: true }).scrollIntoViewIfNeeded();
  const chart = page
    .locator("[data-chart]")
    .filter({ has: page.getByRole("img", { name: /^Sample café orders per hour/ }) });

  await expect(chart.getByRole("list", { name: "Data status" }).getByRole("listitem")).toHaveText([
    /^Measured/,
    /^Estimated/,
    /^Provisional/,
    /^Forecast/,
    /^Missing/,
  ]);
});

test("data status page has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/docs/charts/data-status");
  await expect(page.getByRole("heading", { name: "Data Status", level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).include("[data-chart]").analyze();
  expect(results.violations).toEqual([]);
});
