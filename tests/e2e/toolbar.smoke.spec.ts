import { expect, test } from "@playwright/test"

test("toolbar demo renders composed controls and opens a tooltip on focus", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto("/docs/components/toolbar")

  const preview = page.locator('[data-component-preview="toolbar-demo"]')
  await preview.scrollIntoViewIfNeeded()
  const toolbar = preview.getByRole("toolbar")
  await expect(toolbar).toBeVisible()
  await expect(toolbar.getByRole("searchbox", { name: "Find in document" })).toBeVisible()
  await expect(toolbar.getByRole("button", { name: "Save", exact: true })).toBeVisible()

  const alignLeft = toolbar.getByRole("button", { name: "Align left", exact: true })
  await page.keyboard.press("Tab")
  await alignLeft.focus()
  const popup = page.locator('[data-slot="tooltip-content"]')
  await expect(popup).toHaveText("Align left")
  await expect(popup).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(popup).toHaveCount(0)
  await expect(alignLeft).toBeFocused()

  for (const name of ["toolbar-canvas-controls", "toolbar-media-controls", "toolbar-density-controls"]) {
    const example = page.locator(`[data-component-preview="${name}"]`)
    await example.scrollIntoViewIfNeeded()
    await expect(example.getByRole("toolbar")).toBeVisible()
  }
  expect(errors).toEqual([])
})
