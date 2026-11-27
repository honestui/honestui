import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

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

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

test.describe("Conversation starters, plan, and queue", () => {
  test("Prompt Suggestions sends the full prompt and moves with the arrow keys", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/prompt-suggestions")
    const preview = await mountPreview(page, "prompt-suggestions-demo", "prompt-suggestions")
    const chips = preview.locator('[data-slot="prompt-suggestion"]')

    await expect(preview.getByRole("list", { name: "Suggested prompts" })).toBeVisible()
    await expect(chips).toHaveCount(4)

    // One Tab stop: only the first chip is in the Tab order.
    await expect(chips.nth(0)).toHaveAttribute("tabindex", "0")
    await expect(chips.nth(1)).toHaveAttribute("tabindex", "-1")

    await chips.nth(0).focus()
    await page.keyboard.press("ArrowRight")
    await expect(chips.nth(1)).toBeFocused()
    await page.keyboard.press("End")
    await expect(chips.nth(3)).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(chips.nth(0)).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(chips.nth(3)).toBeFocused()
    await page.keyboard.press("Home")
    await expect(chips.nth(0)).toBeFocused()

    // The label is short; the prompt sent is the longer one.
    await page.keyboard.press("Enter")
    await expect(preview.getByText("Sent: Which invoices are more than 30 days late?")).toBeVisible()

    await chips.nth(1).click()
    await expect(preview.getByText("Sent: Chart this month's revenue")).toBeVisible()

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Chat Welcome puts a starter in the composer, and fits Chat Thread's empty state", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/chat-welcome")
    const preview = await mountPreview(page, "chat-welcome-demo", "chat-welcome")

    await expect(preview.getByRole("region", { name: "What should we look into?" })).toBeVisible()
    await expect(preview.getByRole("heading", { level: 2, name: "What should we look into?" })).toBeVisible()

    await preview.getByRole("button", { name: "Draft a payment reminder" }).click()
    await expect(preview.getByRole("textbox")).toHaveValue("Draft a payment reminder")

    const thread = await mountPreview(page, "chat-welcome-thread", "chat-welcome")
    await expect(thread.locator('[data-slot="chat-welcome"]')).toBeVisible()
    await expect(thread.getByRole("button", { name: "Summarize open invoices" })).toBeVisible()

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Plan collapses from the keyboard and settles on Approve", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/plan")
    const preview = await mountPreview(page, "plan-demo", "plan")
    const trigger = preview.locator('[data-slot="plan-trigger"]')
    const steps = preview.locator('[data-slot="plan-step"]')

    await expect(trigger).toHaveAttribute("aria-expanded", "true")
    await expect(trigger).toContainText("4 steps")
    await expect(steps).toHaveCount(4)
    await expect(steps.nth(1)).toContainText("Step 2: Find the rows that broke the schema")

    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(steps.first()).toBeHidden()
    await page.keyboard.press("Space")
    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    await expectNoAxeViolations(page)

    await preview.getByRole("button", { name: "Approve plan" }).click()
    await expect(preview.locator('[data-slot="plan"]')).toHaveAttribute("data-status", "approved")
    await expect(trigger).toContainText("Approved")
    await expect(preview.getByRole("button", { name: "Approve plan" })).toHaveCount(0)
    await expect(preview.getByRole("button", { name: "Revise" })).toHaveCount(0)

    await preview.getByRole("button", { name: "Reset" }).click()
    await preview.getByRole("button", { name: "Revise" }).click()
    await expect(trigger).toContainText("Revising")

    expect(errors).toEqual([])
  })

  test("Plan streams its steps in, then offers the actions", async ({ page }) => {
    await page.goto("/docs/ai/plan")
    const preview = await mountPreview(page, "plan-streaming", "plan")
    await preview.getByRole("button", { name: "Replay" }).click()

    const plan = preview.locator('[data-slot="plan"]')
    await expect(plan).toHaveAttribute("data-status", "streaming")
    await expect(plan).toHaveAttribute("aria-busy", "true")
    await expect(preview.getByRole("button", { name: "Approve plan" })).toHaveCount(0)

    await expect(plan).toHaveAttribute("data-status", "proposed", { timeout: 10_000 })
    await expect(preview.locator('[data-slot="plan-step"]')).toHaveCount(4)
    await expect(preview.getByRole("button", { name: "Approve plan" })).toBeVisible()
  })

  test("Queue reorders, edits, removes, and sends from the keyboard", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/queue")
    const preview = await mountPreview(page, "queue-demo", "queue")
    const items = preview.locator('[data-slot="queue-item"] p:first-child')

    await expect(preview.getByRole("region", { name: "3 queued" })).toBeVisible()
    await expect(preview.locator('[data-slot="queue-send-now"]')).toHaveCount(1)

    await expectNoAxeViolations(page)

    // Move the last item up; focus follows it.
    const moveUp = preview.getByRole("button", { name: "Move up: Skip anything under $50" })
    await moveUp.focus()
    await page.keyboard.press("Enter")
    await expect(items).toHaveText([
      "Also check the EU invoices from March",
      "Skip anything under $50",
      "Then draft a summary for the finance channel",
    ])
    await expect(moveUp).toBeFocused()

    // Move down at the end is disabled but keeps focus.
    const moveDownLast = preview.getByRole("button", { name: "Move down: Then draft a summary for the finance channel" })
    await expect(moveDownLast).toHaveAttribute("aria-disabled", "true")

    // Edit, then cancel with Escape: nothing changes and focus returns to Edit.
    const edit = preview.getByRole("button", { name: "Edit: Skip anything under $50" })
    await edit.focus()
    await page.keyboard.press("Enter")
    const field = preview.getByRole("textbox", { name: "Edit queued message" })
    await expect(field).toBeFocused()
    await field.fill("Skip anything under $20")
    await page.keyboard.press("Escape")
    await expect(items.nth(1)).toHaveText("Skip anything under $50")
    await expect(edit).toBeFocused()

    // Edit and save with Enter.
    await page.keyboard.press("Enter")
    await field.fill("Skip anything under $20")
    await page.keyboard.press("Enter")
    await expect(items.nth(1)).toHaveText("Skip anything under $20")
    await expect(preview.getByRole("button", { name: "Edit: Skip anything under $20" })).toBeFocused()

    // Remove moves focus to the next item's Remove.
    await preview.getByRole("button", { name: "Remove: Skip anything under $20" }).focus()
    await page.keyboard.press("Enter")
    await expect(preview.getByRole("region", { name: "2 queued" })).toBeVisible()
    await expect(
      preview.getByRole("button", { name: "Remove: Then draft a summary for the finance channel" })
    ).toBeFocused()

    // Send now takes the first item.
    await preview.getByRole("button", { name: "Send now: Also check the EU invoices from March" }).click()
    await expect(preview.getByText("Sent: Also check the EU invoices from March")).toBeVisible()
    await expect(preview.getByRole("region", { name: "1 queued" })).toBeVisible()

    // The header collapses the list.
    const trigger = preview.locator('[data-slot="queue-trigger"]')
    await trigger.click()
    await expect(trigger).toHaveAttribute("aria-expanded", "false")

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })
})
