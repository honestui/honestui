import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/hotkey-recorder"

/** Previews lazy-mount near the viewport, so scroll until the control exists. */
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

/**
 * The key the page reads as Mod. Playwright's device profile can report a
 * Windows user agent on a Mac host, so ask the page instead of the host.
 */
async function modKey(page: Page) {
  return page.evaluate(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
    return /mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || "") ? "Meta" : "Control"
  })
}

function recorder(page: Page, label: string) {
  const button = page.getByRole("button", { name: new RegExp(`^${label}`) })
  const root = button.locator('xpath=ancestor::*[@data-slot="hotkey-recorder"][1]')
  return { button, root, status: root.getByRole("status") }
}

test.describe("Hotkey Recorder", () => {
  test("records a combination, cancels, clears, and refuses a bare key", async ({ page }) => {
    await page.goto(docsPage)
    const sidebar = recorder(page, "Toggle sidebar")
    await mountPreview(page, sidebar.button)

    const mod = await modKey(page)
    await sidebar.button.click()
    await expect(sidebar.root).toHaveAttribute("data-recording", "")
    await expect(sidebar.status).toContainText("Press the new shortcut")

    await page.keyboard.press(`${mod}+Shift+L`)
    await expect(sidebar.root).not.toHaveAttribute("data-recording", "")
    await expect(sidebar.button).toHaveAccessibleName(/Shift L/)
    await expect(sidebar.status).toBeEmpty()

    // Escape keeps the shortcut it had.
    await sidebar.button.press("Enter")
    await page.keyboard.press("Escape")
    await expect(sidebar.button).toHaveAccessibleName(/Shift L/)

    // A key without Ctrl, ⌘, or Alt would fire while typing.
    await sidebar.button.press("Enter")
    await page.keyboard.press("J")
    await expect(sidebar.status).toContainText("does not fire while someone types")
    await expect(sidebar.root).toHaveAttribute("data-recording", "")

    await page.keyboard.press("Backspace")
    await expect(sidebar.button).toHaveAccessibleName(/Not set/)
  })

  test("warns when two shortcuts share keys", async ({ page }) => {
    await page.goto(docsPage)
    const sidebar = recorder(page, "Toggle sidebar")
    await mountPreview(page, sidebar.button)

    const mod = await modKey(page)
    await sidebar.button.click()
    await page.keyboard.press(`${mod}+K`)
    await expect(sidebar.status).toContainText("Also used by “Open search”")
    await expect(sidebar.root).toHaveAttribute("data-conflict", "binding")

    const search = recorder(page, "Open search")
    await expect(search.status).toContainText("Also used by “Toggle sidebar”")

    await page.getByRole("button", { name: "Restore defaults" }).click()
    await expect(sidebar.status).toBeEmpty()
  })

  test("blocks a browser shortcut and keeps one value across keyboards", async ({ page }) => {
    await page.goto(docsPage)
    const capture = recorder(page, "Quick capture")
    await mountPreview(page, capture.button)
    const stored = capture.root.locator("xpath=following-sibling::p[1]")

    // This example starts on the Mac keyboard, where Mod is ⌘.
    await capture.button.click()
    await page.keyboard.press("Meta+L")
    await expect(capture.status).toContainText("The browser uses this for “Address bar”")
    await expect(capture.root).toHaveAttribute("data-recording", "")
    await page.keyboard.press("Escape")
    await expect(stored).toContainText("Mod+Shift+Space")

    await expect(capture.root.locator('[data-slot="kbd"]').first()).toHaveText("⇧")
    await page.getByRole("radio", { name: "Windows and Linux" }).or(page.getByRole("button", { name: "Windows and Linux" })).click()
    await expect(capture.root.locator('[data-slot="kbd"]')).toHaveText(["Ctrl", "Shift", "Space"])
    await expect(stored).toContainText("Mod+Shift+Space")
  })

  test("has no axe violations", async ({ page }) => {
    await page.goto(docsPage)
    await mountPreview(page, recorder(page, "Open search").button)
    const results = await new AxeBuilder({ page }).include('[data-slot="hotkey-recorder"]').analyze()
    expect(results.violations).toEqual([])
  })
})
