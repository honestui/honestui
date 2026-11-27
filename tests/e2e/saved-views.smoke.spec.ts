import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/saved-views"

/** Previews lazy-mount near the viewport, so scroll until the nth switcher exists. */
async function mountSwitcher(page: Page, index = 0): Promise<Locator> {
  const switcher = page.locator('[data-slot="saved-views"]').nth(index)
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await switcher.count()) === 1) {
      await switcher.scrollIntoViewIfNeeded()
      return switcher
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`saved views ${index} did not mount`)
}

test.describe("Saved Views docs previews", () => {
  test("a filter change marks the view unsaved, and Discard restores it", async ({ page }) => {
    await page.goto(docsPage)
    const switcher = await mountSwitcher(page)
    const trigger = switcher.getByRole("button", { name: "View: Active admins" })
    await expect(trigger).toBeVisible()
    await expect(switcher.getByRole("status")).toHaveText("")

    // Remove the Role chip from the Filter Bar below the switcher.
    await page
      .getByRole("button", { name: /remove role/i })
      .first()
      .click()
    await expect(
      switcher.getByRole("button", { name: "View: Active admins, unsaved changes" })
    ).toBeVisible()
    await expect(switcher.getByRole("status")).toHaveText("Unsaved changes · Filters changed")

    await switcher.getByRole("button", { name: "Discard" }).click()
    await expect(switcher.getByRole("status")).toHaveText("")
    await expect(page.getByRole("button", { name: /remove role/i }).first()).toBeVisible()
  })

  test("switching views from the keyboard applies the view", async ({ page }) => {
    await page.goto(docsPage)
    const switcher = await mountSwitcher(page)
    await switcher.getByRole("button", { name: /^View:/ }).focus()
    await page.keyboard.press("Enter")
    const pending = page.getByRole("menuitemradio", { name: /Pending invites/ })
    await expect(pending).toBeVisible()
    await pending.click()
    await expect(switcher.getByRole("button", { name: "View: Pending invites" })).toBeVisible()
    await expect(switcher.getByRole("button", { name: "View: Pending invites" })).toBeFocused()
  })

  test("save as new validates the name and selects the new view", async ({ page }) => {
    await page.goto(docsPage)
    const switcher = await mountSwitcher(page)
    await switcher.getByRole("button", { name: /^View:/ }).click()
    await page.getByRole("menuitem", { name: "Save as new view…" }).click()

    const name = switcher.getByRole("textbox", { name: "View name" })
    await expect(name).toBeFocused()
    await expect(name).toHaveValue("Active admins copy")
    await name.fill("all people")
    await expect(switcher.getByRole("alert")).toHaveText("A view with this name already exists.")
    await name.fill("Top accounts")
    await page.keyboard.press("Enter")
    await expect(switcher.getByRole("button", { name: "View: Top accounts" })).toBeFocused()
  })

  test("rename and delete, with Escape cancelling", async ({ page }) => {
    await page.goto(docsPage)
    const switcher = await mountSwitcher(page)
    const trigger = () => switcher.getByRole("button", { name: /^View:/ })

    await trigger().click()
    await page.getByRole("menuitem", { name: "Rename…" }).click()
    await page.keyboard.press("Escape")
    await expect(trigger()).toBeFocused()

    await trigger().click()
    await page.getByRole("menuitem", { name: "Rename…" }).click()
    await switcher.getByRole("textbox", { name: "View name" }).fill("Admins")
    await switcher.getByRole("button", { name: "Save" }).click()
    await expect(switcher.getByRole("button", { name: "View: Admins" })).toBeVisible()

    await trigger().click()
    await page.getByRole("menuitem", { name: "Delete view" }).click()
    const confirm = switcher.getByRole("group", { name: "Delete “Admins”?" })
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused()
    await confirm.getByRole("button", { name: "Delete view" }).click()
    await expect(switcher.getByRole("button", { name: "View: All people" })).toBeVisible()
  })

  test("a locked view offers only Save as new", async ({ page }) => {
    await page.goto(docsPage)
    const switcher = await mountSwitcher(page, 1)
    await expect(
      switcher.getByRole("button", { name: "View: Inbox, unsaved changes" })
    ).toBeVisible()
    await expect(switcher.getByRole("button", { name: "Save as new" })).toBeVisible()
    await expect(switcher.getByRole("button", { name: "Save", exact: true })).toHaveCount(0)
  })

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    await mountSwitcher(page, 1)
    const results = await new AxeBuilder({ page }).include('[data-slot="saved-views"]').analyze()
    expect(results.violations).toEqual([])
  })
})
