import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/permission-matrix"
const ROLES = ["Owner", "Admin", "Editor", "Viewer"]

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

function matrix(page: Page) {
  const grid = page.getByRole("grid", { name: "Workspace permissions" })
  const root = grid.locator('xpath=ancestor::*[@data-slot="permission-matrix"][1]')
  return {
    grid,
    status: root.locator('[data-slot="permission-matrix-footer"]').getByRole("status"),
    cell: (resource: string, role: string) =>
      grid
        .getByRole("row", { name: new RegExp(`^${resource}`) })
        .getByRole("gridcell")
        .nth(ROLES.indexOf(role)),
  }
}

test.describe("Permission Matrix", () => {
  test("says where inherited decisions come from", async ({ page }) => {
    await page.goto(docsPage)
    const { grid, cell } = matrix(page)
    await mountPreview(page, grid)

    await expect(cell("Create projects", "Admin")).toHaveText("Allowed, inherited from Projects")
    await expect(cell("Delete projects", "Editor")).toHaveText("Denied, inherited from Viewer on Delete projects")
    await expect(cell("Projects", "Editor")).toHaveText("Allowed, inherited from Viewer on Projects")
    await expect(cell("API keys", "Viewer")).toHaveText("Denied, not set, so denied")
    await expect(cell("Billing", "Admin")).toHaveText("Denied")
  })

  test("cycles cells with clicks and keys, counts changes, and discards", async ({ page }) => {
    await page.goto(docsPage)
    const { grid, cell, status } = matrix(page)
    await mountPreview(page, grid)

    await cell("Delete projects", "Editor").click()
    await expect(cell("Delete projects", "Editor")).toHaveText("Allowed, changed")
    await expect(status).toHaveText("1 unsaved change")

    // Read-only roles ignore clicks.
    await cell("Billing", "Owner").click()
    await expect(cell("Billing", "Owner")).toHaveText("Allowed")

    await cell("Delete projects", "Editor").focus()
    await page.keyboard.press("ArrowRight")
    await expect(cell("Delete projects", "Viewer")).toBeFocused()
    await page.keyboard.press("a")
    await expect(cell("Delete projects", "Viewer")).toHaveText("Allowed, changed")
    await page.keyboard.press("ArrowUp")
    await expect(cell("Create projects", "Viewer")).toBeFocused()
    await page.keyboard.press("Backspace")
    await expect(cell("Create projects", "Viewer")).toHaveText("Allowed, inherited from Projects, changed")
    await page.keyboard.press("Space")
    await expect(cell("Create projects", "Viewer")).toHaveText("Allowed, changed")
    await expect(status).toHaveText("3 unsaved changes")

    await page.getByRole("button", { name: "Discard" }).click()
    await expect(status).toHaveText("No unsaved changes")
    await expect(cell("Delete projects", "Editor")).toHaveText("Denied, inherited from Viewer on Delete projects")
  })

  test("sets a whole column from its header, then saves", async ({ page }) => {
    await page.goto(docsPage)
    const { grid, cell, status } = matrix(page)
    await mountPreview(page, grid)

    await grid.getByRole("button", { name: /^Admin/ }).click()
    await page.getByRole("menuitem", { name: "Deny all" }).click()
    for (const resource of ["Projects", "Create projects", "Download invoices", "API keys"]) {
      await expect(cell(resource, "Admin")).toHaveText(/^Denied(, changed)?$/)
    }
    await expect(status).toHaveText("8 unsaved changes")

    await page.getByRole("button", { name: "Save changes" }).click()
    await expect(status).toHaveText("No unsaved changes")
  })

  test("moves between headers and cells with the arrow keys", async ({ page }) => {
    await page.goto(docsPage)
    const { grid, cell } = matrix(page)
    await mountPreview(page, grid)

    await cell("Projects", "Owner").focus()
    await page.keyboard.press("ArrowUp")
    await expect(grid.getByRole("columnheader", { name: /Owner/ }).locator("[data-matrix-pos]")).toBeFocused()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowLeft")
    await expect(grid.getByRole("button", { name: /^Projects/ })).toBeFocused()
    await page.keyboard.press("ControlOrMeta+End")
    await expect(cell("API keys", "Viewer")).toBeFocused()
    await page.keyboard.press("Home")
    await expect(grid.getByRole("button", { name: /^API keys/ })).toBeFocused()
  })

  test("has no axe violations", async ({ page }) => {
    await page.goto(docsPage)
    await mountPreview(page, matrix(page).grid)
    const results = await new AxeBuilder({ page }).include('[data-slot="permission-matrix"]').analyze()
    expect(results.violations).toEqual([])
  })
})
