import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/query-builder"

async function mountPreview(page: Page, name: string): Promise<Locator> {
  const preview = page.locator(`[data-component-preview="${name}"]`)
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await preview.locator('[data-slot="query-builder"], [data-slot="filter-bar"], button').count()) > 0) {
      await preview.scrollIntoViewIfNeeded()
      return preview
    }
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(120)
  }
  throw new Error(`preview "${name}" did not mount`)
}

async function choose(page: Page, select: Locator, option: string) {
  await select.click()
  await page.getByRole("option", { name: option, exact: true }).click()
}

test.describe("Query Builder docs previews", () => {
  test("a nested query filters orders, and switching a group to or widens it", async ({ page }) => {
    await page.goto(docsPage)
    const preview = await mountPreview(page, "query-builder-demo")
    const builder = preview.getByRole("group", { name: "Order conditions" })

    await expect(preview.getByText("4 of 10 orders match")).toBeVisible()
    await expect(builder.getByRole("group", { name: "Group 2, match any" })).toBeVisible()
    await expect(builder.getByRole("combobox", { name: "Field for condition 2.1" })).toHaveText("Amount")
    await expect(builder.getByRole("spinbutton", { name: "Value for condition 2.1" })).toHaveValue("1000")

    await choose(page, builder.getByRole("combobox", { name: "How the conditions join" }), "or")
    await expect(preview.getByText("7 of 10 orders match")).toBeVisible()

    const results = await new AxeBuilder({ page }).include('[data-component-preview="query-builder-demo"]').analyze()
    expect(results.violations).toEqual([])
  })

  test("adding and removing by keyboard keeps focus in the builder", async ({ page }) => {
    await page.goto(docsPage)
    const preview = await mountPreview(page, "query-builder-demo")
    const builder = preview.getByRole("group", { name: "Order conditions" })
    const group = builder.getByRole("group", { name: "Group 2, match any" })

    // Add a condition inside the group: focus lands on its field select.
    await group.getByRole("button", { name: "Add condition" }).focus()
    await page.keyboard.press("Enter")
    const field = builder.getByRole("combobox", { name: "Field for condition 2.3" })
    await expect(field).toBeFocused()

    // Change it to Customer contains "labs" by keyboard.
    await page.keyboard.press("Enter")
    await page.getByRole("option", { name: "Customer" }).press("Enter")
    await expect(field).toHaveText("Customer")
    const value = builder.getByRole("textbox", { name: "Value for condition 2.3" })
    await value.fill("labs")
    await expect(preview.getByText("5 of 10 orders match")).toBeVisible()

    // Removing it returns focus to the condition before it.
    await builder.getByRole("button", { name: "Remove condition 2.3" }).click()
    await expect(builder.getByRole("combobox", { name: "Field for condition 2.2" })).toBeFocused()

    // Removing the group moves focus to the condition before it.
    await builder.getByRole("button", { name: "Remove group 2" }).click()
    await expect(builder.getByRole("combobox", { name: "Field for condition 1" })).toBeFocused()
    await expect(preview.getByText("7 of 10 orders match")).toBeVisible()
    await expect(builder.getByRole("button", { name: "Add group" })).toBeVisible()
  })

  test("Filter Bar opens in advanced mode and only returns while the query fits", async ({ page }) => {
    await page.goto(docsPage)
    const preview = await mountPreview(page, "query-builder-filter-bar")
    const advanced = preview.getByRole("button", { name: "Advanced" })

    await expect(advanced).toHaveAttribute("aria-pressed", "false")
    await advanced.click()
    const builder = preview.getByRole("group", { name: "Advanced order filter" })
    await expect(builder.getByRole("combobox", { name: "Field for condition 1" })).toHaveText("Status")

    await builder.getByRole("button", { name: "Add condition" }).first().click()
    await choose(page, builder.getByRole("combobox", { name: "Field for condition 2" }), "Category")
    // An empty condition is dropped when switching back, so it never blocks the switch.
    await choose(page, builder.getByRole("combobox", { name: "How the conditions join" }), "or")
    await expect(advanced).toBeEnabled()
    await builder.getByRole("combobox", { name: "Value for condition 2" }).click()
    await page.getByRole("option", { name: "Design" }).click()
    await page.keyboard.press("Escape")
    await expect(advanced).toBeDisabled()
    await expect(preview.getByText(/stays in advanced mode/)).toBeVisible()

    await choose(page, builder.getByRole("combobox", { name: "How the conditions join" }), "and")
    await expect(advanced).toBeEnabled()
    await advanced.click()
    await expect(builder).toBeHidden()
    // Active and Design: two orders.
    await expect(preview.getByText("2 of 10 orders")).toBeVisible()

    const results = await new AxeBuilder({ page }).include('[data-component-preview="query-builder-filter-bar"]').analyze()
    expect(results.violations).toEqual([])
  })
})
