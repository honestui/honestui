import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/schedule-builder"

async function mountPreview(page: Page, control: Locator) {
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await control.count()) >= 1) {
      await control.first().scrollIntoViewIfNeeded()
      return
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error("the preview did not mount")
}

function builder(page: Page, name: string) {
  const root = page.getByRole("region", { name })
  return {
    root,
    expression: root.locator('[data-slot="schedule-builder-expression"]'),
    summary: root.locator('[data-slot="schedule-builder-summary"]').getByRole("status"),
    runs: root.locator('[data-slot="schedule-builder-run"]'),
  }
}

test.use({ locale: "en-US" })

test.describe("Schedule Builder", () => {
  test("edits a weekly schedule and lists the next runs", async ({ page }) => {
    await page.goto(docsPage)
    const digest = builder(page, "Digest email schedule")
    await mountPreview(page, digest.root)

    await expect(digest.expression).toHaveText("0 9 * * 1-5")
    await expect(digest.summary).toHaveText("Every weekday at 9:00 AM")
    await expect(digest.runs).toHaveCount(5)
    await expect(digest.runs.first()).toContainText("9:00 AM")

    await digest.root.getByRole("button", { name: "Saturday" }).click()
    await expect(digest.expression).toHaveText("0 9 * * 1-6")
    await expect(digest.summary).toHaveText("Every Monday–Saturday at 9:00 AM")

    await digest.root.getByRole("combobox", { name: "Repeats" }).click()
    await page.getByRole("option", { name: "Every few minutes" }).click()
    await expect(digest.expression).toHaveText("*/15 * * * *")
    await expect(digest.summary).toHaveText("Every 15 minutes")

    await digest.root.getByRole("combobox", { name: "Repeats" }).click()
    await page.getByRole("option", { name: "Monthly" }).click()
    await expect(digest.expression).toHaveText("0 9 1 * *")
  })

  test("reports an invalid cron expression and gates saving", async ({ page }) => {
    await page.goto(docsPage)
    const backup = builder(page, "Backup schedule")
    await mountPreview(page, backup.root)

    await expect(backup.summary).toHaveText("At 6:00 AM on day 1 of the month or on Monday")
    const input = backup.root.getByRole("textbox", { name: "Cron expression" })
    const save = page.getByRole("button", { name: "Save schedule" })

    await input.fill("61 6 * * 1")
    await expect(backup.summary).toContainText("The minute must be 0 to 59. This has 61.")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(save).toBeDisabled()

    await input.fill("0 6 * * 1")
    await expect(backup.summary).toHaveText("Every Monday at 6:00 AM")
    await expect(save).toBeEnabled()
    await save.click()
    await expect(page.getByText("Saved:")).toContainText("0 6 * * 1")
    // A friendly shape typed as cron stays in the cron field while it is being edited.
    await expect(input).toBeVisible()
  })

  test("marks a run moved by a clock change, in the chosen zone", async ({ page }) => {
    await page.goto(docsPage)
    const nightly = builder(page, "Nightly cleanup schedule")
    await mountPreview(page, nightly.root)

    await expect(nightly.runs.nth(1)).toContainText("Sun, Mar 8")
    await expect(nightly.runs.nth(1)).toContainText("3:30 AM")
    await expect(nightly.runs.nth(1)).toContainText("Clocks change")
    await expect(nightly.root.locator('[data-slot="schedule-builder-shifted"]')).toHaveCount(1)

    await nightly.root.getByRole("combobox", { name: "Time zone" }).click()
    await page.getByRole("option", { name: "UTC", exact: true }).click()
    await expect(nightly.root.locator('[data-slot="schedule-builder-shifted"]')).toHaveCount(0)
    await expect(nightly.runs.first()).toContainText("2:30 AM")
  })

  test("has no axe violations", async ({ page }) => {
    await page.goto(docsPage)
    const digest = builder(page, "Digest email schedule")
    await mountPreview(page, digest.root)
    await expect(digest.runs.first()).toContainText("AM")
    const results = await new AxeBuilder({ page }).include('[data-slot="schedule-builder"]').analyze()
    expect(results.violations).toEqual([])
  })
})
