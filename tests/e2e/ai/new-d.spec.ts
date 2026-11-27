import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page

async function mountPreview(page: Page, name: string, slot: string) {
  const preview = page.locator(`[data-component-preview="${name}"]`)
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await preview.locator(`[data-slot="${slot}"]`).count()) > 0) {
      await preview.scrollIntoViewIfNeeded()
      return preview
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }
  throw new Error(`the ${name} preview did not mount`)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).include("[data-component-preview]").analyze()
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.target}`)).toEqual([])
}

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    // The docs site loads third-party resources that can refuse a test browser.
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text())
  })
  return errors
}

test.describe("Voice components", () => {
  test("Voice Orb announces its state and changes it", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/voice-orb", { waitUntil: "load" })
    const preview = await mountPreview(page, "voice-orb-demo", "voice-orb")
    const orb = preview.locator('[data-slot="voice-orb"]')
    await expect(orb).toHaveAttribute("data-state", "listening")
    await expect(orb.getByRole("status")).toHaveText("Listening")
    await preview.getByRole("button", { name: "Thinking" }).click()
    await expect(orb).toHaveAttribute("data-state", "thinking")
    await expect(orb.getByRole("status")).toHaveText("Thinking")
    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Voice Orb shows a still glyph with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/docs/ai/voice-orb", { waitUntil: "load" })
    const preview = await mountPreview(page, "voice-orb-demo", "voice-orb")
    await expect(preview.locator('[data-slot="voice-orb-glyph"]')).toBeVisible()
    await expect(preview.locator('[data-slot="voice-orb"] canvas')).toHaveCount(0)
  })

  test("Live Waveform draws, and names its state", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/live-waveform", { waitUntil: "load" })
    const preview = await mountPreview(page, "live-waveform-demo", "live-waveform")
    const wave = preview.locator('[data-slot="live-waveform"]')
    await expect(wave).toHaveAttribute("aria-label", "Audio waveform, live")
    await page.waitForTimeout(600)
    const inked = await wave.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count += 1
      return { count, dpr: canvas.width / canvas.getBoundingClientRect().width }
    })
    expect(inked.count).toBeGreaterThan(50)
    expect(inked.dpr).toBeCloseTo(await page.evaluate(() => window.devicePixelRatio), 1)
    await preview.getByRole("button", { name: "Processing" }).click()
    await expect(wave).toHaveAttribute("data-state", "processing")
    await preview.getByRole("button", { name: "Line" }).click()
    await expect(wave).toHaveAttribute("data-variant", "line")
    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Audio Player plays a rendered file and seeks from the keyboard", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/audio-player", { waitUntil: "load" })
    const preview = await mountPreview(page, "audio-player-demo", "audio-player")
    const slider = preview.getByRole("slider", { name: "Seek" })
    await expect(slider).toHaveAttribute("aria-valuemax", "14", { timeout: 10_000 })
    await expect(preview.locator('[data-slot="audio-player-peaks"] > span')).toHaveCount(96)

    await slider.focus()
    await page.keyboard.press("ArrowRight")
    await expect(slider).toHaveAttribute("aria-valuetext", "0:05 of 0:14")
    await page.keyboard.press("End")
    await expect(slider).toHaveAttribute("aria-valuenow", "14")
    await page.keyboard.press("Home")
    await expect(slider).toHaveAttribute("aria-valuenow", "0")

    const speed = preview.getByRole("button", { name: /Playback speed/ })
    await speed.click()
    await expect(speed).toHaveAccessibleName("Playback speed, 1.25×")
    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("A controlled Audio Player toggles with Space on the scrub bar", async ({ page }) => {
    await page.goto("/docs/ai/audio-player", { waitUntil: "load" })
    const preview = await mountPreview(page, "audio-player-plain", "audio-player")
    const slider = preview.getByRole("slider", { name: "Seek" })
    await slider.focus()
    await page.keyboard.press("Space")
    await expect(preview.getByRole("button", { name: "Pause", exact: true })).toBeVisible()
    await page.keyboard.press("Space")
    await expect(preview.getByRole("button", { name: "Play", exact: true })).toBeVisible()
  })

  test("Transcript Viewer highlights the line being played and seeks on click", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/transcript-viewer", { waitUntil: "load" })
    const preview = await mountPreview(page, "transcript-viewer-demo", "transcript-viewer")
    const current = preview.locator('[data-slot="transcript-segment"][aria-current="true"]')
    await expect(current).toHaveAttribute("data-segment-id", "s1")

    await preview.locator('[data-segment-id="s7"]').click()
    await expect(current).toHaveAttribute("data-segment-id", "s7")
    await expect(preview.getByRole("slider", { name: "Seek" })).toHaveAttribute("aria-valuenow", /^3[89]$/)
    await expect(preview.getByRole("button", { name: "Pause", exact: true })).toBeVisible()

    await preview.locator('[data-slot="transcript-scroll"]').hover()
    await page.mouse.wheel(0, -600)
    await expect(preview.getByRole("button", { name: "Jump to current" })).toBeVisible()
    await preview.getByRole("button", { name: "Jump to current" }).click()
    await expect(preview.getByRole("button", { name: "Jump to current" })).toHaveCount(0)

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Transcript Viewer search marks and counts matches", async ({ page }) => {
    await page.goto("/docs/ai/transcript-viewer", { waitUntil: "load" })
    const preview = await mountPreview(page, "transcript-viewer-search", "transcript-viewer")
    const search = preview.getByRole("searchbox", { name: "Search transcript" })
    await search.fill("flag")
    await expect(preview.getByRole("status")).toHaveText("1 of 5")
    await expect(preview.locator("mark")).toHaveCount(5)
    await search.press("Enter")
    await expect(preview.getByRole("status")).toHaveText("2 of 5")
    await expectNoAxeViolations(page)
  })
})
