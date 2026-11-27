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
  expect(results.violations.map((violation) => violation.id)).toEqual([])
}

test("Test Results opens failures, shows the diff, and reruns failed tests", async ({ page }) => {
  await page.goto("/docs/ai/test-results")
  const preview = await mountPreview(page, "test-results-demo", "test-results")
  const counts = preview.locator('[data-slot="test-results-counts"]')

  await expect(counts).toHaveText("1 failed · 8 passed · 1 skipped · 1.24 s")
  const failedSuite = preview.getByRole("button", { name: /Invoice totals/ })
  await expect(failedSuite).toHaveAttribute("aria-expanded", "true")
  await expect(preview.getByRole("button", { name: /Currency formatting/ })).toHaveAttribute("aria-expanded", "false")
  await expect(preview.locator('[data-slot="test-error"]')).toContainText("1284.38")
  await expectNoAxeViolations(page)

  const rerun = preview.getByRole("button", { name: "Rerun failed" })
  await rerun.click()
  await expect(preview.getByRole("button", { name: "Rerunning" })).toBeDisabled()
  await expect(counts).toHaveText("9 passed · 1 skipped · 1.24 s", { timeout: 5_000 })
  await expect(preview.getByRole("button", { name: "Rerun failed" })).toHaveCount(0)

  // Suites open and close from the keyboard.
  const currency = preview.getByRole("button", { name: /Currency formatting/ })
  await currency.focus()
  await page.keyboard.press("Enter")
  await expect(currency).toHaveAttribute("aria-expanded", "true")
  await expect(preview.getByText("formats JPY without decimals")).toBeVisible()
})

test("Checkpoint confirms before restoring, and the list moves Current", async ({ page }) => {
  await page.goto("/docs/ai/checkpoint")
  const preview = await mountPreview(page, "checkpoint-demo", "checkpoint")

  const restore = preview.getByRole("button", { name: "Restore: Before the rounding refactor" })
  await restore.click()
  const confirm = preview.locator('[data-slot="checkpoint-confirm-restore"]')
  await expect(confirm).toBeFocused()
  await expect(preview.getByText("Discard the changes made after this?")).toBeVisible()
  await expectNoAxeViolations(page)

  await page.keyboard.press("Escape")
  await expect(confirm).toHaveCount(0)
  await expect(restore).toBeFocused()

  await restore.click()
  await confirm.click()
  await expect(preview.locator('[data-slot="checkpoint-restored"]')).toHaveText("Restored", { timeout: 5_000 })
  await expect(preview.getByText("The workspace is back to how it was at 2:14 PM.", { exact: false })).toBeVisible()

  const list = await mountPreview(page, "checkpoint-list", "checkpoint-list")
  await list.getByRole("button", { name: "Restore: Call sites switched" }).click()
  await list.locator('[data-slot="checkpoint-confirm-restore"]').click()
  await expect(list.locator('[data-slot="checkpoint-item"][data-current]')).toContainText("Call sites switched", {
    timeout: 5_000,
  })
  await expectNoAxeViolations(page)
})

test("Voice Input records, transcribes, and cancels without touching the microphone", async ({ page }) => {
  await page.addInitScript(() => {
    const win = window as unknown as { __micRequests: number }
    win.__micRequests = 0
    const devices = navigator.mediaDevices
    if (devices) {
      devices.getUserMedia = () => {
        win.__micRequests += 1
        return Promise.reject(new Error("blocked in tests"))
      }
    }
  })
  await page.goto("/docs/ai/voice-input")
  const preview = await mountPreview(page, "voice-input-demo", "voice-input")
  const status = preview.locator('[data-slot="voice-input-status"]')

  await expect(status).toHaveText("Tap to speak")
  await expectNoAxeViolations(page)

  await preview.getByRole("button", { name: "Start voice input" }).click()
  const stop = preview.getByRole("button", { name: "Stop recording" })
  await expect(stop).toBeVisible({ timeout: 5_000 })
  await expect(stop).toBeFocused()
  await expect(status).toHaveText("Listening")
  await expect(preview.getByRole("timer")).toHaveText(/^0:0\d$/)
  await expectNoAxeViolations(page)

  await page.keyboard.press("Escape")
  await expect(status).toHaveText("Tap to speak")
  await expect(preview.getByRole("button", { name: "Start voice input" })).toBeFocused()

  await page.keyboard.press("Enter")
  await expect(stop).toBeVisible({ timeout: 5_000 })
  await stop.click()
  await expect(status).toHaveText("Transcribing")
  await expect(status).toHaveText("Added to your message", { timeout: 5_000 })
  await expect(preview.getByText("Summarize the failing billing tests", { exact: false })).toBeVisible()

  const composer = await mountPreview(page, "voice-input-composer", "voice-input")
  await composer.getByRole("button", { name: "Start voice input" }).click()
  await composer.getByRole("button", { name: "Stop recording" }).click()
  await expect(composer.getByRole("textbox", { name: "Message" })).toHaveValue(
    "Which suppliers have orders due this week?",
    { timeout: 5_000 }
  )
  await expectNoAxeViolations(page)

  expect(await page.evaluate(() => (window as unknown as { __micRequests: number }).__micRequests)).toBe(0)
})
