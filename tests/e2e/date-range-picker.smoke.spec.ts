import { expect, test } from "@playwright/test"

const docsPage = "/docs/product/date-range-picker"
const PREVIEW_COUNT = 10

function root(page: import("@playwright/test").Page, nth: number) {
  return page.locator('[data-slot="date-range-picker-root"]').nth(nth)
}

function trigger(page: import("@playwright/test").Page, nth: number) {
  return page.locator('[data-slot="date-range-trigger"]').nth(nth)
}

/**
 * Popovers portal to body, so every in-popup locator scopes to the open
 * popup rather than to the picker wrapper.
 */
function popup(page: import("@playwright/test").Page) {
  // Scope to open popups so a still-exiting panel cannot match first.
  return page.locator('[data-slot="popover-content"][data-open]')
}

function dayButtons(page: import("@playwright/test").Page) {
  return popup(page).locator("table td > button:not([disabled])")
}

/**
 * Previews lazy-mount only while natively scrolled near the viewport, and
 * each mount grows the page for the next one. Drive real wheel events until
 * every picker has mounted.
 */
async function mountAllPreviews(page: import("@playwright/test").Page) {
  const reloadButton = page.locator('button[aria-label="Reload preview"]').first()
  await expect(reloadButton).toBeVisible()
  await page.mouse.move(700, 400)
  for (let i = 0; i < 100; i += 1) {
    const mounted = await trigger(page, PREVIEW_COUNT - 1).count()
    if (mounted === 1 && (await popup(page).count()) === 0) {
      break
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  expect(await trigger(page, PREVIEW_COUNT - 1).count()).toBe(1)
}

test.beforeEach(async ({ page }) => {
  await page.goto(docsPage)
  await mountAllPreviews(page)
})

test("basic selection commits on the second click and closes", async ({ page }) => {
  const idx = 1
  const trig = trigger(page, idx)
  await trig.click()
  await expect(trig).toHaveAttribute("aria-expanded", "true")

  await dayButtons(page).first().click()
  await expect(trig).toContainText("- Select end date")
  await expect(trig).toHaveAttribute("aria-expanded", "true")

  await dayButtons(page).nth(2).click()
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")
  await expect(trig).not.toContainText("Select end date")
  // The example prints its readout as a sibling of the picker root.
  const readout = trig.locator('xpath=../../p[@role="status"]')
  await expect(readout).toContainText("Selected")
})

test("clear does not open the popover and restores the placeholder", async ({ page }) => {
  const idx = 1
  const trig = trigger(page, idx)
  await trig.click()
  await dayButtons(page).first().click()
  await dayButtons(page).nth(2).click()
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")

  await root(page, idx).locator('button[aria-label="Clear date range"]').click()
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")
  await expect(trig).toContainText("Select date range")
})

test("reverse-order picks normalize to start through end", async ({ page }) => {
  const idx = 2
  const trig = trigger(page, idx)
  await trig.click()
  const cells = dayButtons(page)
  await cells.nth(5).click()
  await cells.nth(1).click()
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")
  await expect(trig).toContainText(/ - /)
})

test("a preset commits immediately without confirm mode", async ({ page }) => {
  const idx = 2
  const trig = trigger(page, idx)
  await trig.click()
  await popup(page).getByRole("button", { name: "Last 7 days" }).click()
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")
  await expect(trig).toContainText(/ - /)
})

test("confirm mode keeps drafts temporary until Apply", async ({ page }) => {
  const idx = 3
  const trig = trigger(page, idx)
  await trig.click()

  const apply = popup(page).getByRole("button", { name: "Apply" })
  await dayButtons(page).first().click()
  await expect(apply).toBeDisabled()
  await dayButtons(page).nth(4).click()
  await expect(trig).toHaveAttribute("aria-expanded", "true")
  await expect(apply).toBeEnabled()

  // Escape discards the draft instead of committing it.
  await page.keyboard.press("Escape")
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")
  await expect(trig).toContainText("Select date range")

  await trig.click()
  await popup(page).getByRole("button", { name: "Last 7 days" }).click()
  await apply.click()
  await expect(trig).not.toHaveAttribute("aria-expanded", "true")
  await expect(trig).toContainText(/ - /)
})

test("footer clear resets the draft while staying open", async ({ page }) => {
  const idx = 3
  const trig = trigger(page, idx)
  await trig.click()
  await dayButtons(page).nth(2).click()
  await popup(page).getByRole("button", { name: "Clear", exact: true }).click()

  await expect(trig).toHaveAttribute("aria-expanded", "true")
  await expect(trig).toContainText("Select date range")
  await expect(popup(page).getByRole("button", { name: "Apply" })).toBeDisabled()
  await page.keyboard.press("Escape")
})

test("keyboard moves the roving focus and Enter selects", async ({ page }) => {
  const idx = 5
  const trig = trigger(page, idx)
  await trig.click()

  await expect(popup(page).locator('td[data-focused="true"] > button')).toHaveCount(1)
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("ArrowDown")
  await expect(popup(page).locator('table td > button[tabindex="0"]')).toHaveCount(1)

  await page.keyboard.press("Enter")
  await expect(trig).toContainText("- Select end date")
})

test("navigation stops at the minDate month", async ({ page }) => {
  const idx = 4
  const trig = trigger(page, idx)
  await trig.click()
  await expect(popup(page).getByRole("button", { name: "Previous month" })).toBeDisabled()
  await expect(popup(page).getByRole("button", { name: "Next month" })).toBeEnabled()
})
