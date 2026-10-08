import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/async-action"

/**
 * Previews lazy-mount while scrolled near the viewport, so drive wheel
 * events until the preview's landmark control exists.
 */
async function mountPreview(page: Page, control: Locator) {
  await page.mouse.move(700, 400)

  for (let i = 0; i < 120; i += 1) {
    if ((await control.count()) === 1) {
      await control.scrollIntoViewIfNeeded()
      return
    }

    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }

  throw new Error("the preview did not mount")
}

/** The status rendered in the same preview as `control`. */
function statusNear(control: Locator) {
  return control
    .locator('xpath=ancestor::*[.//*[@data-slot="action-status"]][1]')
    .locator('[data-slot="action-status"]')
}

test.describe("Async Action docs previews", () => {
  test("archive removes the row at once, then undo brings it back", async ({ page }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "Active projects" })
    await mountPreview(page, list)
    const status = statusNear(list)

    await expect(status.getByRole("status")).toBeEmpty()

    await list.getByRole("button", { name: "Archive Docs refresh" }).click()

    // The row is gone while the request is still pending.
    await expect(status).toHaveAttribute("data-phase", "pending")
    await expect(list.getByRole("listitem")).toHaveText([/Billing migration/, /Onboarding emails/])
    await expect(status.getByRole("status")).toHaveText("Archiving Docs refresh…")

    await expect(status.getByRole("status")).toHaveText("Docs refresh archived.")
    await status.getByRole("button", { name: "Undo" }).click()

    await expect(status.getByRole("status")).toHaveText("Docs refresh restored.")
    await expect(list.getByRole("listitem")).toHaveText([
      /Docs refresh/,
      /Billing migration/,
      /Onboarding emails/,
    ])
    await expect(status.getByRole("button", { name: "Undo" })).toHaveCount(0)
  })

  test("keyboard focus moves to the status when archive removes the focused row", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "Active projects" })
    await mountPreview(page, list)
    const status = statusNear(list)

    await list.getByRole("button", { name: "Archive Billing migration" }).focus()
    await page.keyboard.press("Enter")

    await expect(status).toBeFocused()
    await expect(status.getByRole("status")).toHaveText("Billing migration archived.")

    await page.keyboard.press("Tab")
    await expect(status.getByRole("button", { name: "Undo" })).toBeFocused()

    // Undo leaves the DOM once pressed, and focus stays on the status.
    await page.keyboard.press("Enter")
    await expect(status.getByRole("status")).toHaveText("Billing migration restored.")
    await expect(status).toBeFocused()
  })

  test("a failed request returns the row with retry, and no undo without a reversal", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "Projects to archive" })
    await mountPreview(page, list)
    const status = statusNear(list)

    await list.getByRole("button", { name: "Archive Q3 roadmap" }).click()
    await expect(list.getByRole("listitem")).toHaveCount(1)

    await expect(status.getByRole("status")).toHaveText(
      "The request failed, so Q3 roadmap is back in the list."
    )
    await expect(list.getByRole("listitem")).toHaveText([/Q3 roadmap/, /Support macros/])

    await status.getByRole("button", { name: "Retry" }).click()
    await expect(list.getByRole("listitem")).toHaveCount(1)
    await expect(status.getByRole("status")).toHaveText("Q3 roadmap archived.")
    await expect(status.getByRole("button", { name: "Undo" })).toHaveCount(0)

    await status.getByRole("button", { name: "Dismiss" }).click()
    await expect(status.getByRole("status")).toBeEmpty()
    await expect(status.getByRole("button")).toHaveCount(0)
  })

  test("repeated presses start one request, and cancel stops it", async ({ page }) => {
    await page.goto(docsPage)
    const button = page.getByRole("button", { name: /^Export/ })
    await mountPreview(page, button)
    const status = statusNear(button)
    const started = page.getByText(/^Requests started:/)

    await button.focus()
    await page.keyboard.press("Enter")
    await page.keyboard.press("Enter")
    await page.keyboard.press("Space")

    await expect(started).toHaveText("Requests started: 1")
    await expect(button).toHaveText("Exporting…")
    await expect(button).toHaveAttribute("aria-disabled", "true")
    // Inactive, but still the focused element.
    await expect(button).toBeFocused()

    await status.getByRole("button", { name: "Cancel" }).click()
    await expect(status.getByRole("status")).toHaveText("Export cancelled.")
    await expect(button).toHaveText("Export report")
    await expect(button).not.toHaveAttribute("aria-disabled", "true")

    // Longer than the request would have taken: the cancelled run must not report success.
    await page.waitForTimeout(4500)
    await expect(status.getByRole("status")).toHaveText("Export cancelled.")
    await expect(started).toHaveText("Requests started: 1")
  })

  test("the hook drives a switch and returns it to the saved value on failure", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const toggle = page.getByRole("switch", { name: "Email me a weekly summary" })
    await mountPreview(page, toggle)
    const status = statusNear(toggle)

    await toggle.click()
    await expect(toggle).toBeChecked()
    await expect(status.getByRole("status")).toHaveText("Saving…")

    await expect(status.getByRole("status")).toHaveText(
      "Not saved. The setting is back to what it was."
    )
    await expect(toggle).not.toBeChecked()

    await status.getByRole("button", { name: "Retry" }).click()
    await expect(status.getByRole("status")).toHaveText("Saved.")
    await expect(toggle).toBeChecked()
  })

  test("buttons and statuses have no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "Projects to archive" })
    await mountPreview(page, list)
    const status = statusNear(list)

    await list.getByRole("button", { name: "Archive Q3 roadmap" }).click()
    await expect(status.getByRole("button", { name: "Retry" })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[data-slot="action-status"]')
      .include('[data-slot="action-button"]')
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("the status wraps at phone width without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "Projects to archive" })
    await mountPreview(page, list)
    const status = statusNear(list)

    await list.getByRole("button", { name: "Archive Q3 roadmap" }).click()
    await expect(status.getByRole("button", { name: "Retry" })).toBeVisible()

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflows).toBe(false)
  })
})
