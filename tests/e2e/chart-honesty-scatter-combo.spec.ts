import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCATTER_PAGE = "/docs/charts/scatter-chart/static";
const COMBO_PAGE = "/docs/charts/combo-chart/static";

async function mountChart(page: Page, name: string): Promise<Locator> {
  const host = page.locator(`[data-component-preview="${name}"]`);
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
    await page.mouse.move(box.x + box.width * fraction, box.y + box.height * 0.6);
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

async function expectNoAxeViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .include(`[data-component-preview="${name}"] [data-chart]`)
    .analyze();
  expect(results.violations, name).toEqual([]);
}

test.describe("ScatterChart honesty", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SCATTER_PAGE);
  });

  test("small samples are ringed, keyed, and named in the label", async ({ page }) => {
    const name = "ex-sample-size-echarts-scatter-chart";
    const chart = await mountChart(page, name);

    // n stays in the tooltip by default, so only the low-sample entry is keyed.
    await expect(key(chart).getByRole("listitem")).toHaveText([/^Fewer than 30/]);
    await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Fewer than 30\./);
    await expectNoAxeViolations(page, name);
  });

  test("each axis that does not start at zero is reported on its own", async ({ page }) => {
    const name = "ex-truncated-axis-echarts-scatter-chart";
    const chart = await mountChart(page, name);

    await expect(key(chart).getByRole("listitem")).toHaveText([
      /^X axis starts at 40 km/,
      /^Y axis starts at 3:00/,
    ]);
    await expect(chart.getByRole("img")).toHaveAttribute(
      "aria-label",
      /The x axis stops at 40 km instead of zero.*The y axis stops at 3:00 instead of zero/,
    );
    await expectNoAxeViolations(page, name);
  });

  test("a default scatter plot reports nothing", async ({ page }) => {
    const chart = await mountChart(page, "ex-echarts-scatter-chart");
    await expect(key(chart)).toHaveCount(0);
  });
});

test.describe("ComboChart honesty", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(COMBO_PAGE);
  });

  test("an open month is keyed, labelled, and explained in the tooltip", async ({ page }) => {
    const name = "ex-partial-period-echarts-combo-chart";
    const chart = await mountChart(page, name);

    await expect(key(chart).getByRole("listitem")).toHaveText([/^Month to date/]);
    await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Month to date from Nov\./);

    await hoverCategory(page, chart, "Nov");
    await expect(tooltip(chart).getByText(/87% of this period has passed\./)).toBeVisible();
    await expect(tooltip(chart).getByText("Month to date", { exact: true }).first()).toBeVisible();

    await hoverCategory(page, chart, "Sep");
    await expect(tooltip(chart).getByText(/this period has passed/)).toHaveCount(0);
    await expectNoAxeViolations(page, name);
  });

  test("a band on a line is keyed and read out on the line's row", async ({ page }) => {
    const name = "ex-confidence-band-echarts-combo-chart";
    const chart = await mountChart(page, name);

    await expect(key(chart).getByRole("listitem")).toHaveText([/^80% interval/]);

    await hoverCategory(page, chart, "Nov");
    await expect(tooltip(chart).getByText("80% interval 1,360 – 1,710")).toBeVisible();
    await expectNoAxeViolations(page, name);
  });

  test("bar sample sizes are keyed, and a small sample is flagged", async ({ page }) => {
    const name = "ex-sample-size-echarts-combo-chart";
    const chart = await mountChart(page, name);

    await expect(key(chart).getByRole("listitem")).toHaveText([/^Sample size/, /^Fewer than 30/]);

    await hoverCategory(page, chart, "Nov 24");
    await expect(tooltip(chart).getByText("n=14")).toBeVisible();
    await expect(tooltip(chart).getByText(/Few observations stand behind this value/)).toBeVisible();
    await expectNoAxeViolations(page, name);
  });

  test("a combo chart without honesty marks shows no key", async ({ page }) => {
    const chart = await mountChart(page, "ex-echarts-combo-chart");
    await expect(key(chart)).toHaveCount(0);
  });
});
