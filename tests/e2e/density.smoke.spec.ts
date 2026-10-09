import { devices, expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/components/density"

async function openPreview(page: Page, name: string) {
  await page.goto(docsPage)
  const preview = page.locator(`[data-component-preview="${name}"]`)
  await preview.scrollIntoViewIfNeeded()
  return preview
}

function height(locator: Locator) {
  return locator.evaluate((element) => element.getBoundingClientRect().height)
}

test.describe("Density docs previews", () => {
  test("one scope sizes the table section and leaves the neighboring form comfortable", async ({
    page,
  }) => {
    const preview = await openPreview(page, "density-demo")
    const tableScope = preview.getByTestId("density-demo-table-scope")
    const exportButton = tableScope.getByRole("button", { name: "Export" })
    const statusFilter = tableScope.getByRole("combobox", { name: "Filter by status" })
    const firstRow = tableScope.getByRole("row", { name: /INV-1042/ })
    const saveButton = preview.getByRole("button", { name: "Save settings" })

    await expect(tableScope).toHaveAttribute("data-density", "compact")
    expect(await height(exportButton)).toBe(28)
    expect(await height(statusFilter)).toBe(28)
    expect(await height(saveButton)).toBe(40)
    const compactRowHeight = await height(firstRow)

    await preview.getByRole("button", { name: "Default", exact: true }).click()
    await expect(tableScope).toHaveAttribute("data-density", "default")
    expect(await height(exportButton)).toBe(32)
    expect(await height(firstRow)).toBeGreaterThan(compactRowHeight)

    await preview.getByRole("button", { name: "Comfortable", exact: true }).click()
    expect(await height(exportButton)).toBe(40)
    expect(await height(saveButton)).toBe(40)
  })

  test("a portaled menu takes the density of the scope its trigger is in", async ({ page }) => {
    const preview = await openPreview(page, "density-demo")

    await preview.getByRole("button", { name: "Actions for INV-1042" }).click()
    const menu = page.getByRole("menu")
    const item = menu.getByRole("menuitem", { name: "View invoice" })

    await expect(menu).toHaveAttribute("data-density", "compact")
    await expect(item).toHaveCSS("padding-top", "4px")

    await page.keyboard.press("Escape")
    await preview.getByRole("button", { name: "Comfortable", exact: true }).click()
    await preview.getByRole("button", { name: "Actions for INV-1042" }).click()

    await expect(page.getByRole("menu")).toHaveAttribute("data-density", "comfortable")
    await expect(
      page.getByRole("menuitem", { name: "View invoice" })
    ).toHaveCSS("padding-top", "12px")
  })

  test("a nested scope overrides its parent for sizes and variants", async ({ page }) => {
    const preview = await openPreview(page, "density-nested")
    const inner = preview.getByTestId("density-nested-inner")

    expect(await height(preview.getByRole("button", { name: "Filter" }))).toBe(28)
    expect(await height(inner.getByRole("button", { name: "Save note" }))).toBe(40)

    const variantLabels = preview.getByText("(compact variant active)")
    await expect(variantLabels).toHaveCount(2)
    await expect(variantLabels.first()).toBeVisible()
    await expect(variantLabels.last()).toBeHidden()
  })

  test("the demo preview has no automatically detectable accessibility violations", async ({
    page,
  }) => {
    await openPreview(page, "density-demo")

    const results = await new AxeBuilder({ page })
      .include('[data-component-preview="density-demo"]')
      // Table's header text color measures 3.69:1 at HEAD, before density existed.
      // It is excluded so this check covers what the density demo adds.
      .exclude('[data-slot="table-head"]')
      .analyze()

    expect(results.violations).toEqual([])
  })
})

test.describe("Density on a coarse pointer", () => {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = devices["Pixel 7"]
  test.use({ viewport, userAgent, deviceScaleFactor, isMobile, hasTouch })

  test("a compact scope gives controls, rows, and menu items a 44px minimum height", async ({
    page,
  }) => {
    const preview = await openPreview(page, "density-demo")
    const tableScope = preview.getByTestId("density-demo-table-scope")

    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true)
    await expect(tableScope).toHaveAttribute("data-density", "compact")
    expect(await height(tableScope.getByRole("button", { name: "Export" }))).toBe(44)
    expect(
      await height(tableScope.getByRole("button", { name: "Actions for INV-1042" }))
    ).toBe(44)
    expect(await height(tableScope.getByRole("row", { name: /INV-1042/ }))).toBeGreaterThanOrEqual(44)

    await tableScope.getByRole("button", { name: "Actions for INV-1042" }).tap()
    expect(
      await height(page.getByRole("menuitem", { name: "View invoice" }))
    ).toBeGreaterThanOrEqual(44)
  })
})
