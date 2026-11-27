import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page

const SHADER_PAGE = "/docs/shaders/audio-orb"

async function mountPreview(page: Page, name: string) {
  const preview = page.locator(`[data-component-preview="${name}"]`)
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await preview.locator('[data-slot="audio-orb"]').count()) > 0) {
      await preview.scrollIntoViewIfNeeded()
      return preview
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`the ${name} preview did not mount`)
}

/** Counts microphone requests, so a test can prove none happen on load. */
async function watchMicrophone(page: Page) {
  await page.addInitScript(() => {
    const scope = window as unknown as { __micRequests: number }
    scope.__micRequests = 0
    const devices = navigator.mediaDevices
    if (devices) {
      devices.getUserMedia = async () => {
        scope.__micRequests += 1
        throw new DOMException("Blocked in tests", "NotAllowedError")
      }
    }
  })
  return () => page.evaluate(() => (window as unknown as { __micRequests: number }).__micRequests)
}

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text())
  })
  return errors
}

test.describe("Audio Orb", () => {
  test("draws, follows the state, and announces it without asking for the microphone", async ({ page }) => {
    const micRequests = await watchMicrophone(page)
    const errors = collectErrors(page)
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "audio-orb-demo")
    const orb = preview.locator('[data-slot="audio-orb"]')

    await expect(orb.locator("canvas")).toHaveCount(1)
    await expect(orb).toHaveAttribute("data-state", "speaking")
    await expect(orb.getByRole("status")).toHaveText("Speaking")

    await page.getByRole("combobox", { name: "State" }).click()
    await page.getByRole("option", { name: "Listening" }).click()
    await expect(orb).toHaveAttribute("data-state", "listening")
    await expect(orb.getByRole("status")).toHaveText("Listening")

    await page.getByRole("combobox", { name: "State" }).click()
    await page.getByRole("option", { name: "Idle" }).click()
    await expect(orb.getByRole("status")).toHaveText("Voice assistant ready")

    // The canvas is sized in device pixels from its container.
    const size = await orb.locator("canvas").evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height])
    expect(size[0]).toBeGreaterThan(100)
    expect(size[1]).toBeGreaterThan(100)

    expect(await micRequests()).toBe(0)
    expect(errors).toEqual([])
  })

  test("asks for the microphone only when the button is pressed", async ({ page }) => {
    const micRequests = await watchMicrophone(page)
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "audio-orb-microphone")
    expect(await micRequests()).toBe(0)

    await preview.getByRole("button", { name: "Use microphone" }).click()
    expect(await micRequests()).toBe(1)
    await expect(preview.getByRole("alert")).toHaveText("The microphone is unavailable or was not allowed.")
    await expect(preview.locator('[data-slot="audio-orb"]')).toHaveAttribute("data-state", "idle")
  })

  test("shows a still orb with a mark for the state when motion is reduced", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(SHADER_PAGE)
    const preview = await mountPreview(page, "audio-orb-demo")
    const orb = preview.locator('[data-slot="audio-orb"]')

    await expect(orb.locator('[data-slot="audio-orb-glyph"]')).toBeVisible()
    await page.getByRole("combobox", { name: "State" }).click()
    await page.getByRole("option", { name: "Thinking" }).click()
    await expect(orb.getByRole("status")).toHaveText("Thinking")
    await expect(orb.locator('[data-slot="audio-orb-glyph"] circle')).toHaveCount(3)
  })

  test("the Voice Orb docs play a conversation with the shader orb", async ({ page }) => {
    const micRequests = await watchMicrophone(page)
    const errors = collectErrors(page)
    await page.goto("/docs/ai/voice-orb")
    const preview = await mountPreview(page, "voice-orb-shader")
    const orb = preview.locator('[data-slot="audio-orb"]')

    await expect(orb.locator("canvas")).toHaveCount(1)
    await expect(orb).toHaveAttribute("data-state", /listening|thinking|speaking/, { timeout: 8000 })
    await preview.getByRole("button", { name: "Pause" }).click()
    await expect(preview.getByRole("button", { name: "Play" })).toBeVisible()

    expect(await micRequests()).toBe(0)
    expect(errors).toEqual([])
  })

  test("the orb and the microphone preview have no detectable accessibility violations", async ({ page }) => {
    await page.goto(SHADER_PAGE)
    await mountPreview(page, "audio-orb-demo")
    await mountPreview(page, "audio-orb-microphone")
    // The shared playground controls are left out: they are not part of the orb.
    const results = await new AxeBuilder({ page })
      .include('[data-component-preview="audio-orb-demo"] [data-slot="audio-orb"]')
      .include('[data-component-preview="audio-orb-microphone"]')
      .analyze()
    expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.target}`)).toEqual([])
  })
})
