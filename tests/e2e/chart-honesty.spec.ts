import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Each mark's line-chart example is the first preview on its own page.
const HONESTY_PAGES: Record<string, string> = {
  "partial-period": "/docs/charts/honesty/partial-period",
  "confidence-band": "/docs/charts/honesty/confidence-bands",
  "data-gaps": "/docs/charts/honesty/data-gaps",
  "truncated-axis": "/docs/charts/honesty/truncated-axis",
  "sample-size": "/docs/charts/honesty/sample-size",
};

function preview(page: Page, name: string): Locator {
  return page.locator(`[data-component-preview="ex-${name}-echarts-line-chart"]`);
}

async function mountChart(page: Page, name: string): Promise<Locator> {
  await page.goto(HONESTY_PAGES[name]);
  const host = preview(page, name);
  // Previews mount when they scroll into view.
  await host.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const chart = host.locator("[data-chart]");
  await expect(chart.locator("canvas").first()).toBeVisible();
  return chart;
}

// Sweeps the pointer across the plot until the tooltip shows `category`.
async function hoverCategory(page: Page, chart: Locator, category: string) {
  const canvas = chart.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("The chart canvas has no layout box.");
  for (let fraction = 0.04; fraction <= 0.99; fraction += 0.01) {
    await page.mouse.move(box.x + box.width * fraction, box.y + box.height * 0.5);
    const header = chart.getByText(category, { exact: true });
    if (await header.isVisible().catch(() => false)) return;
  }
  throw new Error(`No tooltip for ${category}.`);
}

// The tooltip shell ECharts renders inside the chart.
function tooltip(chart: Locator) {
  return chart.locator("div.min-w-32");
}

function key(chart: Locator) {
  return chart.getByRole("list", { name: "Data status" });
}

test("a partial period is named in the key, the label, and the tooltip", async ({ page }) => {
  const chart = await mountChart(page, "partial-period");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Month to date/]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Month to date from Nov\./);

  await hoverCategory(page, chart, "Nov");
  await expect(tooltip(chart).getByText(/87% of this period has passed\./)).toBeVisible();
  // The period's own note explains the tail, so it is not also called provisional.
  await expect(tooltip(chart).getByText(/^Provisional:/)).toHaveCount(0);
});

test("bands are keyed and their ranges read out on the series row", async ({ page }) => {
  const chart = await mountChart(page, "confidence-band");

  await expect(key(chart).getByRole("listitem")).toHaveText([
    /^Measured/,
    /^Forecast/,
    /^80% interval/,
    /^50% interval/,
  ]);

  await hoverCategory(page, chart, "W9");
  await expect(
    tooltip(chart).getByText("Forecast · 80% interval 190 – 274 · 50% interval 213 – 250"),
  ).toBeVisible();
});

test("absent days are shown as gaps, named in the key and the label", async ({ page }) => {
  const chart = await mountChart(page, "data-gaps");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^No data/]);
  await expect(chart.getByRole("img")).toHaveAttribute(
    "aria-label",
    /No data: 2026-11-07 to 2026-11-09, 2026-11-13\./,
  );

  await hoverCategory(page, chart, "2026-11-08");
  await expect(tooltip(chart).getByText(/Nothing was recorded here/)).toBeVisible();
});

test("an axis that does not start at zero says so", async ({ page }) => {
  const chart = await mountChart(page, "truncated-axis");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Axis starts at 99\.6%/]);
  await expect(chart.getByRole("img")).toHaveAttribute(
    "aria-label",
    /stops at 99\.6% instead of zero/,
  );
});

test("sample sizes are keyed, and a small sample is flagged in the tooltip", async ({ page }) => {
  const chart = await mountChart(page, "sample-size");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Sample size/, /^Fewer than 30/]);

  await hoverCategory(page, chart, "Oct 27");
  await expect(tooltip(chart).getByText(/n=18/)).toBeVisible();
  await expect(tooltip(chart).getByText(/Few observations stand behind this value/)).toBeVisible();
});

test("honesty marks have no detectable accessibility violations", async ({ page }) => {
  for (const name of Object.keys(HONESTY_PAGES)) {
    await mountChart(page, name);
    const results = await new AxeBuilder({ page })
      .include(`[data-component-preview="ex-${name}-echarts-line-chart"] [data-chart]`)
      .analyze();
    expect(results.violations, name).toEqual([]);
  }
});
