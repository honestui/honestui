import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/undoable-action"

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

test.describe("Undoable Action docs previews", () => {
  test("archive applies at once, Undo takes it back, and nothing is announced twice", async ({ page }) => {
    await page.goto(docsPage)
    const inbox = page.getByRole("list", { name: "Inbox" })
    await mountPreview(page, inbox)
    const bar = page.getByRole("region", { name: "Recent actions" })

    await inbox.getByRole("button", { name: "Archive “Invoice #1042 is paid”" }).click()
    await expect(inbox.getByRole("listitem")).toHaveCount(4)

    const entry = bar.locator('[data-slot="undo-bar-entry"]')
    await expect(entry).toHaveAttribute("data-phase", "waiting")
    await expect(bar.getByRole("status")).toHaveText(
      "Archived “Invoice #1042 is paid”. Undo is available for 6 seconds."
    )

    await bar.getByRole("button", { name: "Undo: Archived “Invoice #1042 is paid”" }).click()
    await expect(inbox.getByRole("listitem")).toHaveCount(5)
    await expect(inbox.getByRole("listitem").nth(1)).toContainText("Invoice #1042 is paid")
    await expect(entry).toHaveCount(0)
    await expect(bar.getByRole("status")).toHaveText("Undone: Archived “Invoice #1042 is paid”.")
    // The pressed button is gone; focus stays on the bar rather than the page.
    await expect(bar).toBeFocused()
  })

  test("the countdown commits when it runs out, and holds while focus is in the bar", async ({ page }) => {
    await page.goto(docsPage)
    const inbox = page.getByRole("list", { name: "Inbox" })
    await mountPreview(page, inbox)
    const bar = page.getByRole("region", { name: "Recent actions" })

    await page.getByRole("button", { name: "Archive 3 read" }).click()
    await expect(inbox.getByRole("listitem")).toHaveCount(2)
    const undo = bar.getByRole("button", { name: "Undo: Archived 3 conversations" })

    // Focus holds the countdown well past its six seconds.
    await undo.focus()
    await page.mouse.move(5, 5)
    const seconds = bar.locator('[data-slot="undo-bar-seconds"]')
    const before = await seconds.textContent()
    await page.waitForTimeout(2500)
    await expect(seconds).toHaveText(before ?? "")

    // Released, it runs out and the request goes through.
    await undo.blur()
    await expect(bar.locator('[data-slot="undo-bar-entry"]')).toHaveCount(0, { timeout: 12_000 })
    await expect(inbox.getByRole("listitem")).toHaveCount(2)
  })

  test("a failed commit brings the row back and Retry sends it again", async ({ page }) => {
    await page.goto(docsPage)
    const files = page.getByRole("list", { name: "Shared files" })
    await mountPreview(page, files)
    const bar = page.getByRole("region", { name: "Recent file actions" })

    await files.getByRole("button", { name: "Delete headshots.zip" }).click()
    await expect(files.getByRole("listitem")).toHaveCount(2)
    await page.mouse.move(5, 5)

    const entry = bar.locator('[data-slot="undo-bar-entry"]')
    await expect(entry).toHaveAttribute("data-phase", "failed", { timeout: 10_000 })
    await expect(files.getByRole("listitem")).toHaveCount(3)
    await expect(bar.getByRole("status")).toContainText("Could not delete headshots.zip")

    await bar.getByRole("button", { name: "Retry" }).click()
    await expect(files.getByRole("listitem")).toHaveCount(2)
    await expect(entry).toHaveCount(0)
  })

  test("the bar has no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    const inbox = page.getByRole("list", { name: "Inbox" })
    await mountPreview(page, inbox)
    await page.getByRole("button", { name: "Archive 3 read" }).click()
    await inbox.getByRole("button", { name: "Archive “Q4 roadmap review notes”" }).click()

    const results = await new AxeBuilder({ page }).include('[data-slot="undo-bar"]').analyze()
    expect(results.violations).toEqual([])
  })
})
