import { expect, test } from "@playwright/test"

type Page = import("@playwright/test").Page

const docsPage = "/docs/components/density"

function tokens(page: Page) {
  return page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement)
    return {
      radius: styles.getPropertyValue("--hui-radius-2").trim(),
      control: styles.getPropertyValue("--hui-font-size-control").trim(),
      accent: styles.getPropertyValue("--hui-accent-9").trim(),
    }
  })
}

function setRootAttribute(page: Page, name: string, value: string) {
  return page.evaluate(
    ([attribute, attributeValue]) =>
      document.documentElement.setAttribute(attribute, attributeValue),
    [name, value]
  )
}

test.describe("Soft style", () => {
  test("resolves soft tokens on the site and leaves other styles alone", async ({ page }) => {
    await page.goto(docsPage)

    const soft = await tokens(page)
    expect(soft.radius).toBe("10px")
    expect(soft.control).toBe("14px")

    await setRootAttribute(page, "data-style", "modern")
    const modern = await tokens(page)
    expect(modern.radius).toBe("4px")
    expect(modern.control).toBe("13px")
    expect(modern.accent).not.toBe(soft.accent)
  })

  test("a data-accent-color scope keeps its own accent", async ({ page }) => {
    await page.goto(docsPage)
    const soft = await tokens(page)

    await setRootAttribute(page, "data-style", "modern")
    await setRootAttribute(page, "data-accent-color", "orange")
    const modernOrange = await tokens(page)

    await setRootAttribute(page, "data-style", "soft")
    const softOrange = await tokens(page)

    expect(softOrange.accent).not.toBe(soft.accent)
    expect(softOrange.accent).toBe(modernOrange.accent)
  })
})

test.describe("Soft style components", () => {
  test("controls grow to 36px and an explicit density still wins", async ({ page }) => {
    await page.goto("/docs/components/density")
    const preview = page.locator('[data-component-preview="density-demo"]')
    await preview.scrollIntoViewIfNeeded()
    const scope = preview.getByTestId("density-demo-table-scope")
    await expect(scope.getByRole("button", { name: "Export" })).toHaveCSS("min-height", "28px")

    const height = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--hui-density-control-height").trim()
    )
    expect(height).toBe("36px")
  })

  test("ghost buttons have no resting border", async ({ page }) => {
    await page.goto("/docs/components/button")
    const preview = page.locator('[data-component-preview="button-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.getByRole("button", { name: "Cancel" })).toHaveCSS(
      "border-top-color",
      "rgba(0, 0, 0, 0)"
    )
  })

  test("fields pair a pale hairline with a faint shadow", async ({ page }) => {
    await page.goto("/docs/components/input")
    const preview = page.locator('[data-component-preview="input-demo"]')
    await preview.scrollIntoViewIfNeeded()
    const shadow = await preview
      .locator('[data-slot="input-control"]')
      .evaluate((element) => getComputedStyle(element).boxShadow)
    expect(shadow).not.toBe("none")
  })

  test("only numeric table cells use tabular figures", async ({ page }) => {
    await page.goto("/docs/components/table")
    const preview = page.locator('[data-component-preview="table-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.locator("table")).toHaveCSS("font-variant-numeric", "normal")
    await expect(preview.getByRole("cell", { name: "$12,500" })).toHaveCSS(
      "font-variant-numeric",
      "tabular-nums"
    )
  })

  test("cards use the large soft radius", async ({ page }) => {
    await page.goto("/docs/components/card")
    const card = page.locator('[data-slot="card"]').first()
    await expect(card).toHaveCSS("border-top-left-radius", "20px")
  })

  test("frame corners stay concentric with their panels", async ({ page }) => {
    await page.goto("/docs/components/frame")
    const preview = page.locator('[data-component-preview="frame-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.locator('[data-slot="frame"]')).toHaveCSS("border-top-left-radius", "20px")
    await expect(preview.locator('[data-slot="frame"]')).toHaveCSS("padding-top", "8px")
    await expect(preview.locator('[data-slot="frame-panel"]')).toHaveCSS("border-top-left-radius", "12px")
  })
})
