import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/onboarding-checklist"

/** Previews lazy-mount while scrolled near the viewport. */
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

test.describe("Onboarding Checklist docs previews", () => {
  test("ticking the open step updates progress and opens the next one", async ({ page }) => {
    await page.goto(docsPage)
    await mountPreview(page, page.getByRole("region", { name: "Get started with Northwind" }))
    // Once every required step is done the title, and so the region's name, changes.
    const guide = page.locator('[data-slot="onboarding-checklist"]').first()
    const progress = guide.getByRole("progressbar", { name: "Setup progress" })

    await expect(progress).toHaveAttribute("aria-valuetext", "1 of 5 done")
    await expect(guide.getByRole("button", { name: "Invite your team" })).toHaveAttribute("aria-expanded", "true")

    const mark = guide.getByRole("checkbox", { name: "Mark “Invite your team” as done" })
    await mark.press("Space")
    await expect(mark).toHaveAttribute("aria-checked", "true")
    await expect(progress).toHaveAttribute("aria-valuetext", "2 of 5 done")
    await expect(guide.getByRole("button", { name: "Connect a repository" })).toHaveAttribute(
      "aria-expanded",
      "true"
    )

    // An automatic step has nothing to tick; its own button completes it here.
    await expect(guide.getByRole("checkbox", { name: /Connect a repository/ })).toHaveCount(0)
    await guide.getByRole("button", { name: "Connect GitHub" }).click()
    await expect(guide.getByRole("img", { name: "Done" })).toHaveCount(1)
    await expect(progress).toHaveAttribute("aria-valuetext", "3 of 5 done")
    await expect(guide).toHaveAccessibleName("You're all set")
  })

  test("skipping an optional step removes it from the count, and Restore brings it back", async ({ page }) => {
    await page.goto(docsPage)
    const guide = page.getByRole("region", { name: "Get started with Northwind" })
    await mountPreview(page, guide)

    await guide.getByRole("button", { name: "Add a custom domain" }).click()
    await guide.getByRole("button", { name: "Skip: Add a custom domain" }).click()
    await expect(guide.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "1 of 4 done")

    const show = guide.getByRole("button", { name: "Show" })
    await show.click()
    await guide.getByRole("button", { name: "Restore: Add a custom domain" }).click()
    await expect(guide.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "1 of 5 done")
  })

  test("completing the guide, dismissing it, and restoring it keeps focus", async ({ page }) => {
    await page.goto(docsPage)
    const guide = page.getByRole("region", { name: "Set up invoicing" })
    await mountPreview(page, guide)

    await guide.getByRole("checkbox", { name: "Mark “Send your first invoice” as done" }).click()
    const done = page.getByRole("region", { name: "You're all set" })
    await expect(done.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "3 of 3 done")

    await done.getByRole("button", { name: "Dismiss guide" }).click()
    const restore = page.getByRole("button", { name: "Setup guide · 3 of 3" })
    await expect(restore).toBeFocused()

    await restore.click()
    await expect(page.getByRole("region", { name: "You're all set" })).toBeFocused()
  })

  test("collapse hides the steps", async ({ page }) => {
    await page.goto(docsPage)
    const guide = page.getByRole("region", { name: "Get started with Northwind" })
    await mountPreview(page, guide)

    await guide.getByRole("button", { name: "Collapse setup guide" }).click()
    await expect(guide.getByRole("checkbox")).toHaveCount(0)
    await guide.getByRole("button", { name: "Expand setup guide" }).click()
    await expect(guide.getByRole("checkbox").first()).toBeVisible()
  })

  test("the guide has no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    const guide = page.getByRole("region", { name: "Get started with Northwind" })
    await mountPreview(page, guide)

    const results = await new AxeBuilder({ page }).include('[data-slot="onboarding-checklist"]').analyze()
    expect(results.violations).toEqual([])
  })
})
