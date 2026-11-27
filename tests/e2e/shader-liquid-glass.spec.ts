import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page

const SHADER_PAGE = "/docs/shaders/liquid-glass"
const SAFARI_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"

async function mountPreview(page: Page, name: string) {
  const preview = page.locator(`[data-component-preview="${name}"]`)
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await preview.locator('[data-slot="liquid-glass"]').count()) > 0) {
      await preview.scrollIntoViewIfNeeded()
      return preview
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`the ${name} preview did not mount`)
}

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text())
  })
  return errors
}

test.describe("Liquid Glass", () => {
  test("refracts through an SVG backdrop filter built for its size in Chromium", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "liquid-glass-demo")
    const glass = preview.locator('[data-slot="liquid-glass"]')

    await expect(glass).toHaveAttribute("data-mode", "refract")
    await expect(glass).toContainText("Glass Houses")

    const filter = glass.locator("filter")
    await expect(filter.locator("feDisplacementMap")).toHaveCount(3)
    const map = await filter.locator("feImage").getAttribute("href")
    expect(map).toMatch(/^data:image\/png;base64,/)

    const backdrop = await glass
      .locator('[data-slot="liquid-glass-backdrop"]')
      .evaluate((node) => getComputedStyle(node).backdropFilter)
    expect(backdrop).toContain("url(")

    // The map is rebuilt for the new size when the panel is resized.
    const width = await filter.getAttribute("width")
    await glass.evaluate((node) => {
      ;(node as HTMLElement).style.width = "200px"
    })
    await expect.poll(() => filter.getAttribute("width")).not.toBe(width)

    expect(errors).toEqual([])
  })

  test("the decorative layers are hidden and the content is not", async ({ page }) => {
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "liquid-glass-demo")
    const glass = preview.locator('[data-slot="liquid-glass"]')

    const hidden = await glass.evaluate((node) =>
      Array.from(node.children)
        .filter((child) => (child as HTMLElement).dataset.slot !== "liquid-glass-content")
        .every((child) => child.getAttribute("aria-hidden") === "true"),
    )
    expect(hidden).toBe(true)
    await expect(glass.locator('[data-slot="liquid-glass-content"]')).not.toHaveAttribute("aria-hidden", "true")
  })

  test("the draggable toolbar moves with the arrow keys and keeps its buttons usable", async ({ page }) => {
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "liquid-glass-draggable")
    const toolbar = preview.getByRole("toolbar", { name: "Text formatting" })
    const handle = toolbar.getByRole("button", { name: "Move toolbar" })

    const before = await toolbar.boundingBox()
    await handle.focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowDown")
    const after = await toolbar.boundingBox()
    expect(after!.x).toBeGreaterThan(before!.x)
    expect(after!.y).toBeGreaterThan(before!.y)

    const italic = toolbar.getByRole("button", { name: "Italic" })
    await expect(italic).toHaveAttribute("aria-pressed", "false")
    await italic.click()
    await expect(italic).toHaveAttribute("aria-pressed", "true")
  })

  test("the previews have no detectable accessibility violations", async ({ page }) => {
    await page.goto(SHADER_PAGE)
    await mountPreview(page, "liquid-glass-demo")
    await mountPreview(page, "liquid-glass-draggable")
    const results = await new AxeBuilder({ page })
      .include('[data-component-preview^="liquid-glass"]')
      .analyze()
    expect(results.violations).toEqual([])
  })
})

test.describe("Liquid Glass fallback", () => {
  test.use({ userAgent: SAFARI_AGENT })

  test("browsers without SVG backdrop filters get frosted glass", async ({ page }) => {
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "liquid-glass-demo")
    const glass = preview.locator('[data-slot="liquid-glass"]')

    await expect(glass).toHaveAttribute("data-mode", "blur")
    await expect(glass.locator("filter")).toHaveCount(0)
    const backdrop = await glass
      .locator('[data-slot="liquid-glass-backdrop"]')
      .evaluate((node) => getComputedStyle(node).backdropFilter)
    expect(backdrop).toContain("blur(")
    expect(backdrop).not.toContain("url(")
  })
})
