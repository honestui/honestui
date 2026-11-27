import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const SHADER_PAGE = "/docs/shaders/ai-glow-border"
const PROMPT_BAR_PAGE = "/docs/ai/prompt-bar"

async function chooseState(page: Page, state: string) {
  await page.getByLabel("State", { exact: true }).click()
  await page.getByRole("option", { name: state, exact: true }).click()
}

async function promptBarGlow(page: Page) {
  const preview = page.locator('[data-component-preview="prompt-bar-glow"]')
  await preview.scrollIntoViewIfNeeded()
  const glow = preview.locator('[data-slot="ai-glow-border"]')
  await expect(glow).toBeVisible({ timeout: 20_000 })
  return { preview, glow }
}

test.describe("AI Glow Border", () => {
  test("draws a canvas around the child and follows the state", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(SHADER_PAGE)

    const border = page.locator('[data-slot="ai-glow-border"]').first()
    await expect(border).toHaveAttribute("data-state", "thinking")
    await expect(border.locator('[data-slot="ai-glow-border-glow"]')).toHaveAttribute("aria-hidden", "true")
    await expect(border.locator("canvas")).toHaveCount(1)

    for (const [label, state] of [
      ["Streaming", "streaming"],
      ["Error", "error"],
      ["Idle", "idle"],
    ]) {
      await chooseState(page, label)
      await expect(border).toHaveAttribute("data-state", state)
    }
    expect(errors).toEqual([])
  })

  test("never takes pointer events from the wrapped element", async ({ page }) => {
    await page.goto(PROMPT_BAR_PAGE)
    const { glow } = await promptBarGlow(page)

    await expect(glow.locator('[data-slot="ai-glow-border-glow"]')).toHaveCSS("pointer-events", "none")
    const textbox = glow.getByRole("textbox")
    // A click on the field lands on the field, even though the light covers it.
    await textbox.click()
    await expect(textbox).toBeFocused()
  })

  test("the prompt bar lights while a reply runs and goes dark when it ends", async ({ page }) => {
    await page.goto(PROMPT_BAR_PAGE)
    const { preview, glow } = await promptBarGlow(page)

    await expect(glow).toHaveAttribute("data-state", "idle")
    const textbox = glow.getByRole("textbox")
    await textbox.fill("Which plans renew this month?")
    await textbox.press("Enter")
    await expect(glow).toHaveAttribute("data-state", "thinking")
    await expect(preview.getByRole("status").last()).toHaveText("Thinking…")
    await expect(glow).toHaveAttribute("data-state", "streaming", { timeout: 5_000 })
    await expect(glow).toHaveAttribute("data-state", "idle", { timeout: 8_000 })
  })

  test("Stop flashes the error state", async ({ page }) => {
    await page.goto(PROMPT_BAR_PAGE)
    const { glow } = await promptBarGlow(page)

    const textbox = glow.getByRole("textbox")
    await textbox.fill("Draft the renewal email")
    await textbox.press("Enter")
    await glow.getByRole("button", { name: /stop/i }).click()
    await expect(glow).toHaveAttribute("data-state", "error")
  })

  test("with reduced motion it still renders every state without errors", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(SHADER_PAGE)

    const border = page.locator('[data-slot="ai-glow-border"]').first()
    await expect(border.locator("canvas")).toHaveCount(1)
    await chooseState(page, "Streaming")
    await expect(border).toHaveAttribute("data-state", "streaming")
    await chooseState(page, "Error")
    await expect(border).toHaveAttribute("data-state", "error")
    expect(errors).toEqual([])
  })

  test("the glowing prompt bar has no detectable accessibility violations", async ({ page }) => {
    await page.goto(PROMPT_BAR_PAGE)
    await promptBarGlow(page)
    const results = await new AxeBuilder({ page })
      .include('[data-component-preview="prompt-bar-glow"]')
      .analyze()
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})
