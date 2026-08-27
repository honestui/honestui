import { expect, test } from "@playwright/test"

test.describe("Filter Bar browser compatibility", () => {
  test("opens, exposes named controls, fits the viewport, and restores focus", async ({
    page,
  }) => {
    await page.goto("/docs/product/filter-bar")
    await expect(
      page.locator('button[aria-label="Reload preview"]').first()
    ).toBeVisible()

    const trigger = page.locator('[data-slot="filter-bar-trigger"]').first()
    await trigger.click()

    const panel = page.locator('[data-slot="filter-bar-panel"]')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole("checkbox", { name: "Active" })).toBeVisible()
    await expect(panel.getByRole("textbox", { name: "Amount" })).toBeVisible()

    const bounds = await panel.boundingBox()
    const viewport = page.viewportSize()

    expect(bounds).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0)
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
      viewport?.width ?? 0
    )

    await page.keyboard.press("Escape")
    await expect(panel).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})
