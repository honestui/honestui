import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/csv-column-mapper"

/** Previews lazy-mount near the viewport, so scroll until the named region exists. */
async function mountRegion(page: Page, name: string): Promise<Locator> {
  const region = page.getByRole("region", { name })
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await region.count()) === 1) {
      await region.scrollIntoViewIfNeeded()
      return region
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`no region named "${name}" mounted`)
}

async function choose(page: Page, select: Locator, option: string) {
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await select.click()
  const listbox = page.getByRole("listbox")
  await expect(listbox).toBeVisible()
  await listbox.getByRole("option", { name: option, exact: false }).first().click()
  await expect(listbox).toHaveCount(0)
}

test.describe("CSV Column Mapper docs previews", () => {
  test("columns open matched by name, with detected types and a type warning", async ({ page }) => {
    await page.goto(docsPage)
    const mapper = await mountRegion(page, "Map columns from customers.csv")

    await expect(mapper.locator('[data-slot="csv-column-mapper-summary"]')).toHaveText("6 of 8 columns mapped · 6 rows")
    for (const [column, field] of [
      ["Full Name", "Name"],
      ["E-mail address", "Email"],
      ["Organisation", "Company"],
      ["Deal size", "Don't import"],
      ["Seats", "Seats"],
      ["Renews on", "Renewal date"],
      ["Opted in", "Newsletter"],
      ["Internal notes", "Don't import"],
    ]) {
      await expect(mapper.getByRole("combobox", { name: `Field for ${column}` })).toHaveText(field)
    }

    await expect(mapper.getByRole("combobox", { name: "Field for Full Name" })).toHaveAccessibleDescription("Matched by alias")
    await expect(mapper.getByRole("combobox", { name: "Field for Seats" })).toHaveAccessibleDescription(
      "Values look like text; Seats expects whole number"
    )
    await expect(mapper.getByRole("row", { name: /Deal size/ })).toContainText("Currency")

    const results = await new AxeBuilder({ page }).include('[data-slot="csv-column-mapper"]').analyze()
    expect(results.violations).toEqual([])
  })

  test("mapping by keyboard moves fields, and Continue sends mapped rows", async ({ page }) => {
    await page.goto(docsPage)
    const mapper = await mountRegion(page, "Map columns from customers.csv")

    const dealSize = mapper.getByRole("combobox", { name: "Field for Deal size" })
    await dealSize.focus()
    await page.keyboard.press("Enter")
    await page.getByRole("option", { name: "Deal value" }).press("Enter")
    await expect(dealSize).toHaveText("Deal value")
    await expect(page.getByRole("listbox")).toHaveCount(0)
    await expect(mapper.locator('[data-slot="csv-column-mapper-summary"]')).toHaveText("7 of 8 columns mapped · 6 rows")

    // A field holds one column: giving Company to Internal notes releases Organisation.
    await choose(page, mapper.getByRole("combobox", { name: "Field for Internal notes" }), "Company")
    await expect(mapper.getByRole("combobox", { name: "Field for Organisation" })).toHaveText("Don't import")

    await mapper.getByRole("button", { name: "Continue with 6 rows" }).click()
    await expect(page.getByRole("status").filter({ hasText: "Mapped 6 rows" })).toContainText(
      'dealValue “$12,400”'
    )
  })

  test("Continue explains a missing required field and moves focus to it", async ({ page }) => {
    await page.goto(docsPage)
    const mapper = await mountRegion(page, "Map columns from customers.csv")

    await choose(page, mapper.getByRole("combobox", { name: "Field for E-mail address" }), "Don't import")
    await mapper.getByRole("button", { name: "Continue with 6 rows" }).click()

    const alert = mapper.getByRole("alert")
    await expect(alert).toHaveText("Choose a column for Email. It is required.")
    await expect(alert).toBeFocused()
  })

  test("the import flow maps a CSV, then reviews it in Paste Table", async ({ page }) => {
    await page.goto(docsPage)
    const flow = page.locator('[data-component-preview="csv-column-mapper-import-flow"]')
    await flow.scrollIntoViewIfNeeded()
    await page.mouse.move(700, 400)
    for (let i = 0; i < 60 && (await flow.getByRole("button", { name: "Use sample file" }).count()) === 0; i += 1) {
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(120)
    }
    await flow.getByRole("button", { name: "Use sample file" }).click()

    const mapper = flow.getByRole("region", { name: "Map columns from contacts.csv" })
    await expect(mapper.getByRole("alert")).toHaveText("Choose a column for Name. It is required.")
    await expect(mapper.getByRole("combobox", { name: "Field for Work email" })).toHaveText("Email")
    await expect(mapper.getByRole("combobox", { name: "Field for Licenses" })).toHaveText("Seats")

    await choose(page, mapper.getByRole("combobox", { name: "Field for Contact" }), "Name")
    await expect(mapper.getByRole("alert")).toBeHidden()
    await mapper.getByRole("button", { name: "Continue with 4 rows" }).click()

    const review = flow.getByRole("region", { name: "Review contacts from contacts.csv" })
    await expect(review.locator('[data-slot="paste-table-summary"]')).toHaveText("4 rows. 3 cells in 3 rows need fixing.")
    await expect(review.getByRole("combobox", { name: "Field for Name" })).toHaveText("Name")
    // The quoted cell keeps its comma.
    await expect(review.getByRole("button", { name: "Edit Company in row 1: Northwind, Inc." })).toBeVisible()

    await review.getByRole("button", { name: "Remove 3 rows with problems" }).click()
    await review.getByRole("button", { name: "Import 1 row" }).click()
    await expect(flow.getByRole("status").filter({ hasText: "Imported" })).toHaveText("Imported 1 contact.")
  })
})
