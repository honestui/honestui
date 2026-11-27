import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Each mark's bar-chart example sits on its honesty page.
const HONESTY_PAGES: Record<string, string> = {
  "partial-period": "/docs/charts/honesty/partial-period",
  "data-gaps": "/docs/charts/honesty/data-gaps",
  "truncated-axis": "/docs/charts/honesty/truncated-axis",
  "sample-size": "/docs/charts/honesty/sample-size",
};

function previewSelector(name: string) {
  return `[data-component-preview="ex-${name}-echarts-bar-chart"]`;
}

async function mountChart(page: Page, name: string): Promise<Locator> {
  await page.goto(HONESTY_PAGES[name]);
  const host = page.locator(previewSelector(name));
  // Previews mount when they scroll into view.
  await host.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const chart = host.locator("[data-chart]");
  await expect(chart.locator("canvas").first()).toBeVisible();
  return chart;
}

// Sweeps the pointer along the category axis until the tooltip shows `category`.
async function hoverCategory(page: Page, chart: Locator, category: string, horizontal = false) {
  const canvas = chart.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("The chart canvas has no layout box.");
  for (let fraction = 0.04; fraction <= 0.99; fraction += 0.01) {
    await page.mouse.move(
      horizontal ? box.x + box.width * 0.5 : box.x + box.width * fraction,
      horizontal ? box.y + box.height * fraction : box.y + box.height * 0.6,
    );
    const header = chart.getByText(category, { exact: true });
    if (await header.isVisible().catch(() => false)) return;
  }
  throw new Error(`No tooltip for ${category}.`);
}

function tooltip(chart: Locator) {
  return chart.locator("div.min-w-32");
}

function key(chart: Locator) {
  return chart.getByRole("list", { name: "Data status" });
}

test("an open month is keyed, labelled, and explained in the tooltip", async ({ page }) => {
  const chart = await mountChart(page, "partial-period");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Month to date/]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Month to date from Nov\./);

  await hoverCategory(page, chart, "Nov");
  await expect(tooltip(chart).getByText(/87% of this period has passed\./)).toBeVisible();
  // The period's own note explains the hatched bars, so they are not also called provisional.
  await expect(tooltip(chart).getByText(/^Provisional:/)).toHaveCount(0);

  await hoverCategory(page, chart, "Oct");
  await expect(tooltip(chart).getByText(/Month to date/)).toHaveCount(0);
});

test("absent days are hatched, and an absent bar is marked missing instead of zero", async ({ page }) => {
  const chart = await mountChart(page, "data-gaps");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Missing/, /^No data/]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /No data: Nov 7 to Nov 8\./);

  await hoverCategory(page, chart, "2026-11-07");
  await expect(tooltip(chart).getByText(/so no bars are drawn/)).toBeVisible();

  await hoverCategory(page, chart, "2026-11-11");
  await expect(tooltip(chart).getByText("Missing", { exact: true })).toBeVisible();
});

test("a bar axis set above zero is kept, flagged, and warned about", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  const chart = await mountChart(page, "truncated-axis");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Axis starts at 80%/]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /stops at 80% instead of zero/);
  await expect
    .poll(() => warnings.some((text) => text.includes("Bars must start at zero")))
    .toBe(true);
});

test("sample sizes label horizontal bars, and a small sample is flagged", async ({ page }) => {
  const chart = await mountChart(page, "sample-size");

  await expect(key(chart).getByRole("listitem")).toHaveText([/^Sample size/, /^Fewer than 30/]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Fewer than 30\./);

  await hoverCategory(page, chart, "Oceania", true);
  await expect(tooltip(chart).getByText(/n=14/)).toBeVisible();
  await expect(tooltip(chart).getByText(/Few observations stand behind this value/)).toBeVisible();
});

test("bar honesty marks have no detectable accessibility violations", async ({ page }) => {
  for (const name of Object.keys(HONESTY_PAGES)) {
    await mountChart(page, name);
    const results = await new AxeBuilder({ page })
      .include(`${previewSelector(name)} [data-chart]`)
      .analyze();
    expect(results.violations, name).toEqual([]);
  }
});
