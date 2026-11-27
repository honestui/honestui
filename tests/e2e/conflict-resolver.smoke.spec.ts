import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/conflict-resolver"

async function mountResolver(page: Page, name: string): Promise<Locator> {
  const resolver = page.getByRole("region", { name })
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await resolver.count()) === 1) {
      await resolver.scrollIntoViewIfNeeded()
      return resolver
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`no conflict resolver named "${name}" mounted`)
}

test.describe("Conflict Resolver docs previews", () => {
  test("shows only conflicts, tracks progress, and applies the merge", async ({ page }) => {
    await page.goto(docsPage)
    const resolver = await mountResolver(page, "Resolve edits to Northwind Labs")
    const summary = resolver.locator('[data-slot="conflict-resolver-summary"]')

    await expect(summary).toHaveText("0 of 2 conflicts resolved. 2 changes merged automatically")
    await expect(resolver.getByRole("radiogroup")).toHaveCount(2)
    const apply = resolver.getByRole("button", { name: "Apply merge" })
    await expect(apply).toBeDisabled()

    const email = resolver.getByRole("radiogroup", { name: "Version of Billing email to keep" })
    await email.locator('[data-side="theirs"]').click()
    await expect(email.getByRole("radio", { name: /Dee Park/ })).toBeChecked()
    await expect(summary).toContainText("1 of 2 conflicts resolved")

    // Arrow keys move the choice within a field, as native radios do.
    const seats = resolver.getByRole("radiogroup", { name: "Version of Seats to keep" })
    await seats.getByRole("radio", { name: /Yours/ }).focus()
    await page.keyboard.press("ArrowDown")
    await expect(seats.getByRole("radio", { name: /Dee Park/ })).toBeChecked()
    await page.keyboard.press("ArrowDown")
    await expect(seats.getByRole("radio", { name: "Write a different value" })).toBeChecked()
    const custom = seats.getByRole("textbox", { name: "Your value for Seats" })
    await custom.fill("18")

    await expect(apply).toBeEnabled()
    await apply.click()
    await expect(
      page.getByText("Saved: finance@northwind.example · +1 415 555 0199 · Business · 18 seats")
    ).toBeVisible()
  })

  test("bulk choice and the merged-field switch", async ({ page }) => {
    await page.goto(docsPage)
    const resolver = await mountResolver(page, "Resolve edits to Northwind Labs")
    await resolver.getByRole("button", { name: "Take all theirs" }).click()
    await expect(resolver.locator('[data-slot="conflict-resolver-summary"]')).toContainText(
      "2 of 2 conflicts resolved"
    )

    await resolver.getByRole("switch", { name: "Show merged fields" }).click()
    await expect(resolver.locator('[data-slot="conflict-resolver-row"]')).toHaveCount(4)
    await expect(resolver.getByText("Only they changed this")).toBeVisible()
    await expect(
      resolver
        .getByRole("radiogroup", { name: "Version of Phone to keep" })
        .getByRole("radio", { name: /Dee Park/ })
    ).toBeChecked()
  })

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    await mountResolver(page, "Resolve edits to the Spring launch campaign")
    const results = await new AxeBuilder({ page })
      .include('[data-slot="conflict-resolver"]')
      .analyze()
    expect(results.violations).toEqual([])
  })
})
