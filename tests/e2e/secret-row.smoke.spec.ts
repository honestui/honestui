import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/secret-row"

/** Previews lazy-mount while scrolled near the viewport. */
async function mountPreview(page: Page, control: Locator) {
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await control.count()) === 1) {
      await control.scrollIntoViewIfNeeded()
      return
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error("the preview did not mount")
}

function row(list: Locator, name: string) {
  return list.locator('[data-slot="secret-row"]').filter({ hasText: name })
}

test.describe("Secret Row docs previews", () => {
  test("masks the value, reveals it on request, and copies it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "API keys" })
    await mountPreview(page, list)
    const production = row(list, "Production server")
    const value = production.locator('[data-slot="secret-row-value"]')

    await expect(value.locator('[aria-hidden="true"]')).toHaveText("hk_live_••••••••••••3f9a")
    await expect(value.locator(".sr-only")).toHaveText("hk_live_, hidden, ending in 3f9a")

    const show = production.getByRole("button", { name: "Show Production server" })
    await expect(show).toHaveAttribute("aria-pressed", "false")
    await show.click()
    await expect(value).toHaveText("hk_live_4eC39HqLyjWDarjtT1zdp7dc3f9a")
    await expect(production.getByRole("button", { name: "Hide Production server" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await production.getByRole("button", { name: "Copy Production server" }).click()
    await expect(production.getByRole("status")).toHaveText("Copied to clipboard.")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "hk_live_4eC39HqLyjWDarjtT1zdp7dc3f9a"
    )
  })

  test("rotation asks first, shows the new key once, and returns focus", async ({ page }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "API keys" })
    await mountPreview(page, list)
    const ci = row(list, "CI pipeline")

    const rotate = ci.getByRole("button", { name: "Rotate CI pipeline" })
    await rotate.click()
    const panel = ci.getByRole("group", { name: "Rotate this key?" })
    await expect(panel.getByRole("button", { name: "Cancel" })).toBeFocused()

    // Escape cancels and puts focus back on Rotate.
    await page.keyboard.press("Escape")
    await expect(panel).toHaveCount(0)
    await expect(rotate).toBeFocused()

    await rotate.click()
    await ci.getByRole("button", { name: "Rotate key" }).click()
    const newKey = ci.getByRole("group", { name: "Copy your new key" })
    await expect(newKey.getByRole("button", { name: "Copy new key" })).toBeFocused()
    const fresh = (await newKey.locator('[data-slot="secret-row-new-value"]').textContent()) ?? ""
    expect(fresh).toMatch(/^hk_live_\w{28}$/)

    await newKey.getByRole("button", { name: "Done" }).click()
    await expect(ci.locator('[data-slot="secret-row-value"] [aria-hidden="true"]')).toHaveText(
      `hk_live_••••••••••••${fresh.slice(-4)}`
    )
  })

  test("revoke keeps the row with a badge and no actions", async ({ page }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "API keys" })
    await mountPreview(page, list)
    const local = row(list, "Local development")

    await local.getByRole("button", { name: "Revoke Local development" }).click()
    await local.getByRole("button", { name: "Revoke key" }).click()
    await expect(local).toHaveAttribute("data-status", "revoked")
    await expect(local.getByText("Revoked", { exact: true })).toBeVisible()
    await expect(local.getByRole("button")).toHaveCount(0)
  })

  test("keys without a readable value offer no Show, and a failed rotation says the key still works", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "Webhook and legacy keys" })
    await mountPreview(page, list)
    const webhook = row(list, "Billing webhook")

    await expect(webhook.getByRole("button", { name: /Show/ })).toHaveCount(0)
    await expect(row(list, "Legacy importer")).toHaveAttribute("data-status", "expired")

    await webhook.getByRole("button", { name: "Rotate Billing webhook" }).click()
    await webhook.getByRole("button", { name: "Rotate key" }).click()
    await expect(webhook.getByRole("status")).toHaveText("The key was not rotated. It still works.")
    await webhook.getByRole("button", { name: "Rotate key" }).click()
    await expect(webhook.getByRole("group", { name: "Copy your new key" })).toBeVisible()
  })

  test("rows and panels have no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "API keys" })
    await mountPreview(page, list)
    await row(list, "CI pipeline").getByRole("button", { name: "Rotate CI pipeline" }).click()

    const results = await new AxeBuilder({ page }).include('[data-slot="secret-list"]').analyze()
    expect(results.violations).toEqual([])
  })

  test("fits a phone without horizontal scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(docsPage)
    const list = page.getByRole("list", { name: "API keys" })
    await mountPreview(page, list)
    await row(list, "Production server").getByRole("button", { name: "Show Production server" }).click()

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflows).toBe(false)
  })
})
