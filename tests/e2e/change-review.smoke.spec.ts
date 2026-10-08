import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/change-review"

/**
 * Previews lazy-mount while scrolled near the viewport, so drive wheel
 * events until the review with this accessible name exists.
 */
async function mountReview(page: import("@playwright/test").Page, name: string) {
  const review = page.getByRole("region", { name })

  await page.mouse.move(700, 400)

  for (let i = 0; i < 120; i += 1) {
    if ((await review.count()) === 1) {
      await review.scrollIntoViewIfNeeded()
      return review
    }

    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }

  throw new Error(`no change review named "${name}" mounted`)
}

function row(review: import("@playwright/test").Locator, label: string) {
  return review.locator('[data-slot="change-review-row"]').filter({
    has: review.page().locator("dt", { hasText: new RegExp(`^${label}$`) }),
  })
}

test.describe("Change Review docs previews", () => {
  test("states each change in words and hides unchanged fields", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Changes to workspace settings")

    await expect(review.getByRole("status")).toHaveText("3 changes in 4 fields")
    await expect(row(review, "Billing email").locator("dd").first()).toHaveText(
      "Was accounts@northwind.example, now billing@northwind.example"
    )
    await expect(row(review, "Notifications").locator("dd").first()).toHaveText(
      "Was Enabled, now Disabled"
    )

    const access = row(review, "Team access")
    await expect(access.locator('[data-slot="change-review-list-summary"]')).toHaveText(
      "2 added, 1 removed"
    )
    await expect(access.getByRole("listitem")).toHaveText([
      "Added: Ana Ruiz",
      "Added: Li Wei",
      "Removed: Sam Cole",
    ])

    await expect(row(review, "Workspace name")).toHaveCount(0)
    // No decision handler was passed, so no decision controls are offered.
    await expect(review.getByRole("button")).toHaveCount(0)
  })

  test("filter switch brings unchanged fields back", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Changes to workspace settings")

    const filter = review.getByRole("switch", { name: "Changed fields only" })
    await expect(filter).toBeChecked()

    await filter.focus()
    await page.keyboard.press("Space")

    await expect(filter).not.toBeChecked()
    await expect(row(review, "Workspace name").locator("dd").first()).toHaveText(
      "Northwind LabsNo change"
    )
  })

  test("decisions work by keyboard and report what would be saved", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Requested profile changes")
    const result = page.getByText(/^Profile after approval:/)

    await expect(review.getByRole("status")).toContainText("0 accepted, 0 rejected, 3 undecided")
    await expect(result).toHaveText(
      "Profile after approval: Dee Park, Support lead, phone not set."
    )

    const acceptName = review.getByRole("button", { name: "Accept change to Display name" })
    await acceptName.focus()
    await page.keyboard.press("Space")
    await expect(acceptName).toHaveAttribute("aria-pressed", "true")

    const rejectTitle = review.getByRole("button", { name: "Reject change to Job title" })
    await rejectTitle.focus()
    await page.keyboard.press("Enter")
    await expect(rejectTitle).toHaveAttribute("aria-pressed", "true")

    await expect(review.getByRole("status")).toContainText("1 accepted, 1 rejected, 1 undecided")
    await expect(result).toHaveText(
      "Profile after approval: Dee Park-Osei, Support lead, phone not set."
    )

    // Pressing the chosen button again returns the change to undecided.
    await acceptName.press("Space")
    await expect(acceptName).toHaveAttribute("aria-pressed", "false")
    await expect(review.getByRole("status")).toContainText("0 accepted, 1 rejected, 2 undecided")
  })

  test("accept all decides every change and then disables itself", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Requested profile changes")

    const acceptAll = review.getByRole("button", { name: "Accept all" })
    await acceptAll.click()

    await expect(review.getByRole("status")).toContainText("3 accepted, 0 rejected, 0 undecided")
    await expect(acceptAll).toBeDisabled()
    await expect(page.getByText(/^Profile after approval:/)).toHaveText(
      "Profile after approval: Dee Park-Osei, Head of support, phone +44 20 7946 0958."
    )
  })

  test("stored change records render without snapshots", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Changes made by Ana Ruiz")

    await expect(row(review, "Plan").locator("dd").first()).toHaveText("Was Team, now Business")
    await expect(row(review, "Seats").locator("dd").first()).toHaveText("Was 12, now 20")
    await expect(row(review, "Single sign-on").locator("dd").first()).toHaveText(
      "Was Disabled, now Enabled"
    )
    await expect(row(review, "Allowed domains").getByRole("listitem")).toHaveText([
      "Added: northwind.example",
    ])
  })

  test("groups nest and custom renderers format stored values", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Changes to order 4821")

    const shipping = review.getByRole("group", { name: "Shipping" })
    await expect(shipping.getByRole("group", { name: "Address" })).toBeVisible()
    await expect(row(review, "Order total").locator("dd").first()).toHaveText(
      "Was £184.50, now £219.40"
    )
    await expect(row(review, "City").locator("dd").first()).toHaveText("LeedsNo change")
  })

  test("an unchanged object shows a message instead of an empty list", async ({ page }) => {
    await page.goto(docsPage)
    const review = await mountReview(page, "Changes to notification settings")

    await expect(review.locator('[data-slot="change-review-empty"]')).toHaveText("Nothing changed.")
    await expect(review.getByRole("status")).toHaveText("0 changes in 2 fields")
  })

  test("reviews have no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    await mountReview(page, "Changes to notification settings")

    const results = await new AxeBuilder({ page })
      .include('[data-slot="change-review-root"]')
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("rows reflow at phone width without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(docsPage)
    const review = await mountReview(page, "Requested profile changes")

    await expect(review.getByRole("button", { name: "Accept change to Phone" })).toBeVisible()
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflows).toBe(false)
  })
})
