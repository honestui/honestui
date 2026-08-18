import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const analyticsPreferenceStorageKey = "honestui.analytics-enabled.v1";

function isAnalyticsRequest(url: string) {
  return (
    url.includes("/_vercel/insights/") ||
    url.includes("va.vercel-scripts.com")
  );
}

async function stubAnalyticsEndpoints(page: Page) {
  await page.route("**/_vercel/insights/**", async (route) => {
    await route.fulfill({
      body: "window.va = window.va || function () {};",
      contentType: "application/javascript",
      status: 200,
    });
  });
  await page.route("https://va.vercel-scripts.com/**", async (route) => {
    await route.fulfill({
      body: "window.va = window.va || function () {};",
      contentType: "application/javascript",
      status: 200,
    });
  });
}

async function chooseCustomizerOption(
  page: Page,
  label: string,
  option: string,
) {
  const trigger = page.getByRole("combobox", { name: label });
  await trigger.click();
  await page
    .getByRole("option", { name: new RegExp(`^${option}(?:\\s|$)`) })
    .click();
  await expect(trigger).toContainText(option);
}

async function readCustomizedTheme(target: ReturnType<Page["locator"]>) {
  return target.evaluate((element) => {
    const scope = element.closest<HTMLElement>("[data-docs-theme-preview]");
    if (!scope) return null;

    const styles = getComputedStyle(scope);
    return {
      accent: scope.dataset.accentColor,
      effects: styles.getPropertyValue("--hui-shadow-feather").trim(),
      fontTitle: styles.getPropertyValue("--hui-font-title").trim(),
      gray: scope.dataset.grayColor,
      radius: styles.getPropertyValue("--hui-radius-1").trim(),
      spacing: styles.getPropertyValue("--hui-space-3").trim(),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, resetMarker }) => {
    if (window.sessionStorage.getItem(resetMarker)) {
      return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.setItem(resetMarker, "true");
  }, {
    key: analyticsPreferenceStorageKey,
    resetMarker: "honestui-e2e-analytics-reset",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("aggregate analytics have no banner and can be disabled", async ({
  page,
}) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (isAnalyticsRequest(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await stubAnalyticsEndpoints(page);

  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Optional analytics" }),
  ).toHaveCount(0);
  await expect
    .poll(() => analyticsRequests.length, { timeout: 5_000 })
    .toBeGreaterThan(0);

  await page.goto("/privacy");
  await expect(page.getByRole("status")).toHaveText(
    "Aggregate traffic analytics are enabled.",
  );
  await page.getByRole("button", { name: "Disable analytics" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Aggregate traffic analytics are disabled.",
  );
  await expect
    .poll(() =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        analyticsPreferenceStorageKey,
      ),
    )
    .toBe("false");

  const requestCountBeforeReload = analyticsRequests.length;
  await page.reload();
  await page.waitForTimeout(250);
  expect(analyticsRequests).toHaveLength(requestCountBeforeReload);
});

test("browser privacy signals disable analytics automatically", async ({
  page,
}) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => {
    if (isAnalyticsRequest(request.url())) {
      analyticsRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "doNotTrack", {
      configurable: true,
      value: "1",
    });
  });
  await stubAnalyticsEndpoints(page);

  await page.goto("/privacy");
  await expect(page.getByRole("status")).toHaveText(
    "Analytics are disabled because your browser sends a privacy signal.",
  );
  await expect(
    page.getByRole("button", { name: "Enable analytics" }),
  ).toBeDisabled();
  await page.waitForTimeout(250);
  expect(analyticsRequests).toEqual([]);
});

test("home, docs, and comparisons reflow without page-level horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ height: 800, width: 320 });
  await page.goto("/");

  for (const path of ["/", "/docs", "/compare"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.documentWidth).toBeLessThanOrEqual(
      dimensions.viewportWidth,
    );
  }
});

test("docs header external links are single interactive elements", async ({
  page,
}) => {
  await page.goto("/docs");

  await expect(page.locator("a button, button a")).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: /Honest UI on GitHub.*opens in a new tab/,
    }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("link", {
      name: /Connor Love’s website.*opens in a new tab/,
    }),
  ).toHaveCount(1);
});

test("public pages have no detectable WCAG A or AA violations", async ({
  page,
}) => {
  for (const path of ["/", "/docs", "/privacy", "/compare"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22a",
        "wcag22aa",
      ])
      .analyze();

    expect(results.violations, path).toEqual([]);
  }
});

test("landing showcase identifies its controls as previews", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByText(
      "These examples are interactive previews; they don’t submit data.",
    ),
  ).toBeVisible();
});

test("published comparisons are discoverable while drafts stay private", async ({
  page,
}) => {
  await page.goto("/compare");

  await expect(
    page.getByRole("heading", { name: "Compare HonestUI" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /^index, follow/,
  );
  const shadcnGuideLink = page.getByRole("link", {
    name: /HonestUI vs shadcn\/ui/,
  });
  await expect(shadcnGuideLink).toBeVisible();
  await expect(shadcnGuideLink).toHaveAttribute("href", "/compare/shadcn-ui");

  const shadcnResponse = await page.goto("/compare/shadcn-ui");
  expect(shadcnResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "HonestUI vs shadcn/ui", level: 1 }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.honestui.com/compare/shadcn-ui",
  );

  const oldShadcnSlugResponse = await page.goto("/compare/shadcn");
  expect(oldShadcnSlugResponse?.status()).toBe(404);

  const draftResponse = await page.goto("/compare/example-library");
  expect(draftResponse?.status()).toBe(404);

  await page.goto("/sitemap.xml");
  await expect(page.locator("body")).toContainText("/compare/shadcn-ui");
  await expect(page.locator("body")).not.toContainText("example-library");
});

test("blur token previews compare sharp and blurred halves", async ({
  page,
}) => {
  await page.goto("/docs/theme/effects");

  await expect(
    page.getByText(
      "Each preview keeps the left half sharp and applies the listed backdrop blur to the right half.",
    ),
  ).toBeVisible();

  const previews = page.locator('[data-token-preview="blur"]');
  await expect(previews).toHaveCount(4);
  await expect(previews.first()).toContainText("SharpBlurred");

  const filters = await page
    .locator('[data-token-preview-effect="blur"]')
    .evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).backdropFilter),
    );
  expect(filters).toEqual([
    "blur(0.5px)",
    "blur(1px)",
    "blur(2px)",
    "blur(4px)",
  ]);
});

test("every theme customizer dimension updates previews and persists", async ({
  page,
}) => {
  await page.goto("/docs/components/button");
  await page.getByRole("button", { name: "Customize" }).click();

  await chooseCustomizerOption(page, "Colors", "Orange");
  await chooseCustomizerOption(page, "Typography", "Classic Serif");
  await chooseCustomizerOption(page, "Spacing", "Relaxed");
  await chooseCustomizerOption(page, "Radius", "Large");
  await chooseCustomizerOption(page, "Effects", "Expressive");

  const preview = page.locator('[data-slot="preview"]').first();
  await expect
    .poll(() => readCustomizedTheme(preview))
    .toEqual({
      accent: "orange",
      effects:
        "0 1px 2px oklch(0 0 0 / 0.12), 0 5px 12px oklch(0 0 0 / 0.08)",
      fontTitle: 'Georgia, "Times New Roman", serif',
      gray: "mauve",
      radius: "4px",
      spacing: "10px",
    });

  await page.getByRole("button", { name: "Done" }).click();
  await page.reload();

  await expect
    .poll(() => readCustomizedTheme(preview))
    .toEqual({
      accent: "orange",
      effects:
        "0 1px 2px oklch(0 0 0 / 0.12), 0 5px 12px oklch(0 0 0 / 0.08)",
      fontTitle: 'Georgia, "Times New Roman", serif',
      gray: "mauve",
      radius: "4px",
      spacing: "10px",
    });
});

test("theme customization reaches dialog and select portal content", async ({
  page,
}) => {
  await page.goto("/docs/components/dialog");
  await page.getByRole("button", { name: "Customize" }).click();
  await chooseCustomizerOption(page, "Style", "Editorial");
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("button", { name: "Open Dialog" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Edit profile" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => readCustomizedTheme(dialog))
    .toMatchObject({
      accent: "orange",
      fontTitle: 'Georgia, "Times New Roman", serif',
      radius: "4px",
      spacing: "10px",
    });

  await page.getByRole("button", { name: "Cancel" }).click();
  await page.goto("/docs/components/select");
  await page
    .locator('[data-slot="preview"] [data-slot="select-trigger"]')
    .first()
    .click();

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await expect
    .poll(() => readCustomizedTheme(listbox))
    .toMatchObject({
      accent: "orange",
      fontTitle: 'Georgia, "Times New Roman", serif',
      radius: "4px",
      spacing: "10px",
    });
});
