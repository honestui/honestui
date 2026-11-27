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

async function expectNoAxeViolations(page: Page, include = "[data-component-preview]") {
  const results = await new AxeBuilder({ page }).include(include).analyze()
  expect(results.violations.map((violation) => violation.id)).toEqual([])
}

test.describe("Usage, guardrails, and input requests", () => {
  test("Message Usage shows an estimate and opens the breakdown from the keyboard", async ({ page }) => {
    await page.goto("/docs/ai/message-usage")
    const preview = await mountPreview(page, "message-usage-demo", "message-usage")
    const trigger = preview.locator('[data-slot="message-usage"]')

    await expect(trigger).toHaveAccessibleName("Usage details: 19,604 tokens, ~$0.0042, 2.4 s, gpt-5-mini")
    await trigger.focus()
    await page.keyboard.press("Enter")
    const details = page.getByRole("dialog", { name: "Usage" })
    await expect(details).toBeVisible()
    await expect(details).toContainText("Cached12,288")
    await expect(details).toContainText("Reasoning640")
    await expect(details).toContainText("Estimated from list prices")
    await expectNoAxeViolations(page)
    await page.keyboard.press("Escape")
    await expect(details).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("Message Usage totals a thread with billed costs", async ({ page }) => {
    await page.goto("/docs/ai/message-usage")
    const preview = await mountPreview(page, "message-usage-thread", "message-usage")
    const total = preview.locator('[data-slot="message-usage"][data-variant="thread"]')

    await expect(total).toHaveAccessibleName("Usage details: Thread total, 3 messages, 25,785 tokens, $0.08")
    await total.click()
    const details = page.getByRole("dialog", { name: "Thread total" })
    await expect(details).toContainText("Total25,785")
    await expect(details).not.toContainText("Latency")
    await expect(details).not.toContainText("Estimated")
    await expectNoAxeViolations(page)
  })

  test("Guardrail Notice names masked spans, reveals through the callback, and lists events", async ({ page }) => {
    await page.goto("/docs/ai/guardrail-notice")
    const preview = await mountPreview(page, "guardrail-notice-demo", "guardrail-notice")

    const email = preview.getByRole("button", { name: /^Masked: Email address/ })
    await expect(email).toHaveText(/email/)
    await expect(preview.getByText("ana.ruiz@northwind.co")).toHaveCount(0)

    await email.focus()
    await page.keyboard.press("Enter")
    const details = page.getByRole("dialog", { name: "Email address" })
    await expect(details).toContainText("pii.email")
    await details.getByRole("button", { name: "Reveal" }).click()
    await expect(email).toContainText("ana.ruiz@northwind.co")
    await expect(details).toContainText("Revealing is recorded.")
    await page.keyboard.press("Escape")

    // A card mask is never revealable.
    await preview.getByRole("button", { name: /^Masked: Card digits/ }).click()
    const card = page.getByRole("dialog", { name: "Card digits" })
    await expect(card).toContainText("pci.pan-fragment")
    await expect(card.getByRole("button", { name: "Reveal" })).toHaveCount(0)
    await page.keyboard.press("Escape")

    // Anything blocked opens the notice by default.
    const summary = preview.locator('[data-slot="guardrail-notice"] > button')
    await expect(summary).toHaveAttribute("aria-expanded", "true")
    await expect(summary).toHaveAccessibleName("Guardrails: 1 request blocked, 3 items masked, 1 flagged for review")
    await expect(summary).toContainText("1 request blocked")
    await expect(summary).toContainText("3 items masked")
    await expect(summary).toContainText("1 flagged for review")
    const events = preview.locator('[data-slot="guardrail-event"]')
    await expect(events).toHaveCount(5)
    await expect(events.first()).toHaveAttribute("data-action", "blocked")
    await expectNoAxeViolations(page)

    await summary.focus()
    await page.keyboard.press("Space")
    await expect(summary).toHaveAttribute("aria-expanded", "false")
    await expect(events.first()).toBeHidden()
  })

  test("Input Request validates, focuses the first problem, and sends normalized values", async ({ page }) => {
    await page.goto("/docs/ai/input-request")
    const preview = await mountPreview(page, "input-request-demo", "input-request")
    const form = preview.locator('[data-slot="input-request"]')

    await expect(form).toHaveAccessibleName("Where and when should I run the orders migration?")
    await expectNoAxeViolations(page)

    await form.getByRole("button", { name: "Send" }).click()
    await expect(form.getByRole("alert")).toHaveText("2 fields need attention.")
    const environment = form.getByRole("combobox", { name: "Target environment" })
    await expect(environment).toBeFocused()
    await expect(environment).toHaveAttribute("aria-invalid", "true")
    await expectNoAxeViolations(page)

    await page.keyboard.press("Enter")
    await page.getByRole("option", { name: "Staging" }).click()
    await expect(environment).not.toHaveAttribute("aria-invalid", "true")
    await form.getByLabel("Maintenance date").fill("2026-12-03")
    await form.getByLabel("Batch size").fill("2500")
    await form.getByRole("checkbox", { name: "Finance" }).check()
    await form.getByRole("switch", { name: "Run a dry run first" }).click()
    await form.getByLabel("Anything else I should know").fill("  Avoid the 9 AM report job.  ")

    await form.getByRole("button", { name: "Send" }).click()
    await expect(form.getByRole("button", { name: "Sending…" })).toBeVisible()
    await expect(form.getByRole("status")).toHaveText("Sent. The run continues with these answers.")
    await expect(form).toBeFocused()
    await expect(form.locator('[data-slot="input-request-summary"]')).toContainText("2,500 rows")

    const received = JSON.parse((await preview.getByLabel("Values received by onSubmit").textContent()) ?? "{}")
    expect(received).toEqual({
      environment: "staging",
      window: "2026-12-03",
      batch: 2500,
      notify: ["oncall", "finance"],
      dryRun: false,
      notes: "Avoid the 9 AM report job.",
    })
  })

  test("Input Request shows finished and expired states", async ({ page }) => {
    await page.goto("/docs/ai/input-request")
    const preview = await mountPreview(page, "input-request-states", "input-request")
    const [submitted, expired] = [
      preview.locator('[data-slot="input-request"]').nth(0),
      preview.locator('[data-slot="input-request"]').nth(1),
    ]

    await expect(submitted).toHaveAttribute("data-status", "submitted")
    await expect(submitted).toContainText("Asked by Campaign agent")
    await expect(submitted.locator('[data-slot="input-request-summary"]')).toContainText("12,000 USD")
    await expect(submitted.locator('[data-slot="input-request-summary"]')).toContainText("Search, Email")
    await expect(expired).toHaveAttribute("data-status", "expired")
    await expect(expired.getByRole("status")).toContainText("expired")
    await expect(expired.getByRole("button")).toHaveCount(0)
    await expectNoAxeViolations(page)
  })
})
