import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/audit-log"

async function mountLog(page: Page, name: string): Promise<Locator> {
  const log = page.getByRole("region", { name })
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if (
      (await log.count()) === 1 &&
      (await log.locator('[data-slot="audit-log-entry"]').count()) > 0
    ) {
      await log.scrollIntoViewIfNeeded()
      return log
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`no audit log named "${name}" mounted`)
}

test.describe("Audit Log docs previews", () => {
  test("groups by day and states each change in words", async ({ page }) => {
    await page.goto(docsPage)
    const log = await mountLog(page, "Activity")

    await expect(log.getByRole("group", { name: "Today" })).toBeVisible()
    await expect(log.getByRole("group", { name: "Yesterday" })).toBeVisible()
    const first = log.locator('[data-slot="audit-log-entry"]').first()
    await expect(first).toContainText("Ana Ruiz changed the plan of Northwind Labs")
    await expect(first.locator("time")).toHaveAttribute("datetime", "2026-11-26T15:18:00.000Z")
    await expect(first.locator('[data-slot="audit-log-change"]').first()).toHaveText(
      "PlanWas Team, now Business"
    )
  })

  test("folds long change lists and opens details", async ({ page }) => {
    await page.goto(docsPage)
    const log = await mountLog(page, "Activity")
    const invoice = log.locator('[data-slot="audit-log-entry"]', { hasText: "Invoice INV-2041" })
    await expect(invoice.locator('[data-slot="audit-log-change"]')).toHaveCount(3)
    await invoice.getByRole("button", { name: "2 more changes" }).click()
    await expect(invoice.locator('[data-slot="audit-log-change"]')).toHaveCount(5)

    const plan = log.locator('[data-slot="audit-log-entry"]').first()
    const details = plan.getByRole("button", { name: "Details" })
    await expect(details).toHaveAttribute("aria-expanded", "false")
    await details.press("Enter")
    await expect(details).toHaveAttribute("aria-expanded", "true")
    await expect(plan.locator('[data-slot="audit-log-details"]')).toContainText("req_8f2c41a9")
  })

  test("filters by person and loads older activity", async ({ page }) => {
    await page.goto(docsPage)
    const log = await mountLog(page, "Activity")
    await log.getByRole("button", { name: "People: Everyone" }).click()
    await page.getByRole("menuitemradio", { name: "Dee Park" }).click()
    await expect(log.locator('[data-slot="audit-log-entry"]')).toHaveCount(1)
    await expect(log.getByRole("status")).toHaveText("1 event")

    await log.getByRole("button", { name: "People: Dee Park" }).click()
    await page.getByRole("menuitemradio", { name: "Everyone" }).click()
    await log.getByRole("button", { name: "Load older activity" }).click()
    await expect(log.locator('[data-slot="audit-log-entry"]')).toHaveCount(7)
    await expect(log.getByRole("button", { name: "Load older activity" })).toHaveCount(0)
  })

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    await mountLog(page, "Invoice INV-2041 history")
    const results = await new AxeBuilder({ page }).include('[data-slot="audit-log"]').analyze()
    expect(results.violations).toEqual([])
  })
})
