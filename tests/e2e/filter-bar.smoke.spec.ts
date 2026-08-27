import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/filter-bar"
const PREVIEW_COUNT = 10

function trigger(page: import("@playwright/test").Page, nth: number) {
  return page.locator('[data-slot="filter-bar-trigger"]').nth(nth)
}

function chipsRow(page: import("@playwright/test").Page, nth: number) {
  return page.locator('[data-slot="filter-bar-values"]').nth(nth)
}

/**
 * Previews lazy-mount while scrolled near the viewport. Drive wheel events
 * until every bar exists on the page, bouncing home twice so skipped
 * intersections fire again on the way past.
 */
async function mountAllPreviews(page: import("@playwright/test").Page) {
  const reloadButton = page.locator('button[aria-label="Reload preview"]').first()
  await expect(reloadButton).toBeVisible()

  await page.mouse.move(700, 400)

  let lastMounted = -1

  for (let i = 0; i < 240; i += 1) {
    const mounted = await trigger(page, PREVIEW_COUNT - 1).count()

    if (mounted === 1) return

    if (i === 70 || i === 150) {
      await page.keyboard.press("Home")
      await page.waitForTimeout(200)
    }

    await page.mouse.wheel(0, 420)
    lastMounted = Math.max(lastMounted, mounted)
    await page.waitForTimeout(140)
  }

  expect(
    await trigger(page, PREVIEW_COUNT - 1).count(),
    `expected ${PREVIEW_COUNT} bars; saw up to ${lastMounted + 1}`
  ).toBe(1)
}

async function openDocs(page: import("@playwright/test").Page) {
  await page.goto(docsPage)
  await mountAllPreviews(page)
}

test.describe("Filter Bar docs previews", () => {
  test.setTimeout(180_000)

  test("filter bars mount across every docs preview", async ({ page }) => {
    await openDocs(page)

    // The first demo starts with three active filters.
    await expect(trigger(page, 0)).toContainText(/Filter/)
    await expect(chipsRow(page, 0)).toBeVisible()
  })

  test("trigger opens the panel and Escape closes it", async ({ page }) => {
    await openDocs(page)

    const first = trigger(page, 0)
    await first.scrollIntoViewIfNeeded()
    await first.click()

    const panel = page.locator('[data-slot="filter-bar-panel"]')
    await expect(panel).toBeVisible()
    await expect(panel).toContainText("Filters")

    // Instant mode keeps committed values; Escape only closes.
    await page.keyboard.press("Escape")
    await expect(panel).toHaveCount(0)
  })

  test("open panel has no detectable WCAG A or AA violations", async ({ page }) => {
    await openDocs(page)

    const first = trigger(page, 0)
    await first.scrollIntoViewIfNeeded()
    await first.click()

    const panel = page.locator('[data-slot="filter-bar-panel"]')
    await expect(panel).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[data-slot="filter-bar-panel"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("operator dropdown and value control share one aligned row", async ({ page }) => {
    await openDocs(page)

    const first = trigger(page, 0)
    await first.scrollIntoViewIfNeeded()
    await first.click()

    const amount = page.locator(
      '[data-slot="filter-bar-panel"] [data-filter-key="amount"]'
    )
    const rule = amount.getByRole("combobox", { name: "Amount rule" })
    const value = amount.locator('[data-slot="number-field"]')
    const ruleBounds = await rule.boundingBox()
    const valueBounds = await value.boundingBox()

    await expect(rule).toContainText("Equals")
    expect(ruleBounds?.y).toBe(valueBounds?.y)
    expect(ruleBounds?.height).toBe(valueBounds?.height)
  })

  test("chip remove button clears its filter from the bar", async ({ page }) => {
    await openDocs(page)

    const firstRow = chipsRow(page, 0)
    await firstRow.scrollIntoViewIfNeeded()

    const before = await firstRow
      .locator('[data-slot="filter-bar-value"]')
      .count()
    expect(before).toBeGreaterThan(0)

    await firstRow.locator('[data-slot="filter-bar-chip-remove"]').first().click()

    const after = await firstRow
      .locator('[data-slot="filter-bar-value"]')
      .count()
    expect(after).toBeLessThan(before)
  })

  test("chip removal moves focus to the next filter", async ({ page }) => {
    await openDocs(page)

    const firstRow = chipsRow(page, 0)
    await firstRow.scrollIntoViewIfNeeded()

    const firstRemove = firstRow
      .locator('[data-slot="filter-bar-chip-remove"]')
      .first()
    await firstRemove.focus()
    await page.keyboard.press("Space")

    await expect(
      firstRow.locator('[data-slot="filter-bar-chip-open"]').first()
    ).toBeFocused()
  })

  test("chip actions meet the 24 pixel minimum target size", async ({ page }) => {
    await openDocs(page)

    const firstRow = chipsRow(page, 0)
    await firstRow.scrollIntoViewIfNeeded()

    for (const slot of ["filter-bar-chip-open", "filter-bar-chip-remove"]) {
      const bounds = await firstRow
        .locator(`[data-slot="${slot}"]`)
        .first()
        .boundingBox()

      expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(24)
      expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(24)
    }
  })

  test("multi-select chip stays visible after more than three selections", async ({ page }) => {
    await openDocs(page)

    const first = trigger(page, 0)
    await first.scrollIntoViewIfNeeded()
    await first.click()

    const categoryOptions = page.locator(
      '[data-slot="filter-bar-panel"] [data-filter-key="category"] [data-slot="filter-bar-option-row"]'
    )
    await categoryOptions.filter({ hasText: "Development" }).click()
    await categoryOptions.filter({ hasText: "Marketing" }).click()
    await categoryOptions.filter({ hasText: "Sales" }).click()
    await page.keyboard.press("Escape")

    const categoryChip = chipsRow(page, 0)
      .locator('[data-slot="filter-bar-chip"]')
      .filter({ hasText: "Category" })

    await expect(categoryChip).toBeVisible()
    await expect(categoryChip).toContainText("Design +3")
  })

  test("valueless text rules remain active and identify the operator", async ({ page }) => {
    await openDocs(page)

    const textRoot = page.locator('[data-slot="filter-bar-root"]').nth(4)
    const textTrigger = textRoot.locator('[data-slot="filter-bar-trigger"]')
    await textTrigger.scrollIntoViewIfNeeded()
    await textTrigger.click()

    const panel = page.locator('[data-slot="filter-bar-panel"]')
    await panel.getByRole("combobox", { name: "Customer rule" }).click()
    await page.getByRole("option", { name: "Is empty", exact: true }).click()

    await expect(panel.getByRole("textbox", { name: "Customer" })).toHaveCount(0)
    await page.keyboard.press("Escape")

    await expect(
      textRoot.locator('[data-slot="filter-bar-chip"]')
    ).toContainText("Customer Is empty")
  })

  test("apply mode discards drafts when the panel closes without Apply", async ({ page }) => {
    await openDocs(page)

    // The data-mode attribute marks the apply demo uniquely; index guessing
    // would drift as examples change.
    const applyRoot = page.locator('[data-slot="filter-bar-root"][data-mode="apply"]')
    const applyTrigger = applyRoot.locator('[data-slot="filter-bar-trigger"]').first()
    await applyTrigger.scrollIntoViewIfNeeded()

    const readout = page
      .locator('p[aria-live="polite"]')
      .filter({ hasText: /Committed/ })
      .first()
    await readout.scrollIntoViewIfNeeded()

    const initial = (await readout.textContent()) ?? ""

    await applyTrigger.click()

    const applyButton = page.getByRole("button", { name: "Apply filters" })
    await expect(applyButton).toBeVisible()

    // Pick two pending values inside the draft so it differs from committed.
    const panel = page.locator('[data-slot="filter-bar-panel"]')
    const options = panel.locator(
      '[data-filter-key="status"] [data-slot="filter-bar-option-row"]'
    )
    await options.first().click()
    await options.nth(1).click()

    const stillOpen = page.locator('[data-slot="filter-bar-panel"]')
    await expect(stillOpen).toBeVisible()

    // Escape behaves like Cancel here.
    await page.keyboard.press("Escape")
    await expect(panel).toHaveCount(0)
    await expect(readout).toHaveText(initial)
  })
})
