import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const PAGE = "/docs/charts/area-chart/static";

async function mountChart(page: Page, name: string): Promise<Locator> {
  const host = page.locator(`[data-component-preview="ex-${name}-echarts-area-chart"]`);
  await host.evaluate((element) => element.scrollIntoView({ block: "center" }));
  const chart = host.locator("[data-chart]");
  await expect(chart.locator("canvas").first()).toBeVisible();
  // Let the entrance animation finish.
  await page.waitForTimeout(1500);
  return chart;
}

// Colors sampled down the middle of the plot, from just under the line to the baseline.
async function sampleFill(chart: Locator) {
  return chart
    .locator("canvas")
    .first()
    .evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return [];
      const x = Math.round(canvas.width * 0.7);
      const out: number[][] = [];
      for (let f = 0.45; f <= 0.8; f += 0.05) {
        const [r, g, b, a] = ctx.getImageData(x, Math.round(canvas.height * f), 1, 1).data;
        out.push([r, g, b, a]);
      }
      return out;
    });
}

function errorsOn(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) {
      errors.push(message.text());
    }
  });
  return errors;
}

test("a grainient fill tints the area in the series color and logs nothing", async ({ page }) => {
  const errors = errorsOn(page);
  await page.goto(PAGE);
  const chart = await mountChart(page, "grainient");
  const samples = await sampleFill(chart);

  // The fill is colored (blue above red and green, for this violet series)
  // and not flat: the grain and the warp vary it down the plot.
  const tinted = samples.filter(([r, g, b]) => b > g + 8 && b > r);
  expect(tinted.length).toBeGreaterThan(samples.length / 2);
  const distinct = new Set(samples.map((s) => s.slice(0, 3).join(",")));
  expect(distinct.size).toBeGreaterThan(2);
  expect(errors).toEqual([]);
});

test("an animated fill drifts, and holds still with reduced motion", async ({ browser }) => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto(PAGE);
    const chart = await mountChart(page, "grainient-stacked");
    const before = await sampleFill(chart);
    await page.waitForTimeout(1200);
    const after = await sampleFill(chart);
    if (reducedMotion === "reduce") expect(after).toEqual(before);
    else expect(after).not.toEqual(before);
    await context.close();
  }
});

test("without WebGL2 the area falls back to the gradient fill", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === "webgl2") return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  const errors = errorsOn(page);
  await page.goto(PAGE);
  const chart = await mountChart(page, "grainient");
  const samples = await sampleFill(chart);
  // Still a faint violet fill under the line.
  expect(samples.some(([, g, b, a]) => a > 0 && b > g)).toBe(true);
  expect(errors).toEqual([]);
});

test("the grainient previews have no detectable accessibility violations", async ({ page }) => {
  await page.goto(PAGE);
  await mountChart(page, "grainient");
  await mountChart(page, "grainient-stacked");
  const results = await new AxeBuilder({ page })
    .include('[data-component-preview^="ex-grainient"]')
    .analyze();
  expect(results.violations).toEqual([]);
});
