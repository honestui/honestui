import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page

/** Previews lazy-mount near the viewport, so scroll until the component renders. */
async function mountPreview(page: Page, name: string, slot: string) {
  const preview = page.locator(`[data-component-preview="${name}"]`)
  await page.mouse.move(700, 400)
  for (let i = 0; i < 120; i += 1) {
    if ((await preview.locator(`[data-slot="${slot}"]`).count()) > 0) {
      await preview.scrollIntoViewIfNeeded()
      return preview
    }
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(100)
  }
  throw new Error(`Preview ${name} did not mount`)
}

async function expectNoAxeViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).include(`[data-component-preview="${name}"]`).analyze()
  expect(results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([])
}

function collectErrors(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text())
  })
  return errors
}

test.describe("Trace Waterfall and Agent Handoff", () => {
  test("Trace Waterfall totals the run, shows the failed span, and moves by keyboard", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/trace-waterfall")
    const preview = await mountPreview(page, "trace-waterfall-demo", "trace-waterfall")
    const trace = preview.locator('[data-slot="trace-waterfall"]')

    await expect(trace).toHaveAttribute("data-status", "error")
    const totals = trace.locator('[data-slot="trace-waterfall-totals"]')
    await expect(totals).toContainText("6.84s")
    // Tokens and cost count leaves only: 1,204 + 96 + 9 + 2,310 + 214.
    await expect(totals).toContainText("3,833")
    await expect(totals).toContainText("Spans8")

    const tree = trace.getByRole("tree", { name: "Answer refund question" })
    const items = tree.getByRole("treeitem")
    await expect(items).toHaveCount(8)

    // The demo opens with the failed lookup chosen and its error shown.
    const failed = trace.locator('[data-slot="trace-waterfall-span"][data-status="error"]')
    await expect(failed).toHaveAttribute("aria-selected", "true")
    const detail = trace.locator('[data-slot="trace-waterfall-detail"]')
    await expect(detail).toContainText("TimeoutError: orders-api did not respond within 350ms")
    await expect(detail.getByRole("region", { name: "get_order" })).toBeVisible()

    // Keyboard: the chosen span holds the tab stop.
    await failed.focus()
    await page.keyboard.press("Escape")
    await expect(detail).toHaveCount(0)
    await page.keyboard.press("Home")
    const root = items.first()
    await expect(root).toBeFocused()
    await expect(root).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("ArrowLeft")
    await expect(root).toHaveAttribute("aria-expanded", "false")
    await expect(tree.getByRole("treeitem")).toHaveCount(1)
    await page.keyboard.press("ArrowRight")
    await expect(tree.getByRole("treeitem")).toHaveCount(8)
    await page.keyboard.press("ArrowRight")
    await expect(items.nth(1)).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(items.nth(1)).toHaveAttribute("aria-selected", "true")
    await expect(detail).toContainText("claude-sonnet-5-5")
    await expect(detail).toContainText("1,204")

    // A nested span: Find refund policy closes and its children leave the tree.
    const policy = tree.getByRole("treeitem", { name: /Find refund policy/ })
    await policy.locator("> div").first().click()
    await expect(detail.getByRole("region", { name: "Find refund policy" })).toBeVisible()
    await expect(detail).toContainText("help-center")
    await expectNoAxeViolations(page, "trace-waterfall-demo")
    await detail.getByRole("button", { name: "Close span details" }).click()
    await expect(detail).toHaveCount(0)

    await expectNoAxeViolations(page, "trace-waterfall-demo")
    expect(errors).toEqual([])
  })

  test("A live trace runs, then completes", async ({ page }) => {
    await page.goto("/docs/ai/trace-waterfall")
    const preview = await mountPreview(page, "trace-waterfall-live", "trace-waterfall")
    const trace = preview.locator('[data-slot="trace-waterfall"]')
    await preview.getByRole("button", { name: "Replay" }).click()
    await expect(trace).toHaveAttribute("data-status", "running")
    await expect(trace.locator('[data-slot="trace-waterfall-span"][data-status="running"]').first()).toBeVisible()
    await expect(trace).toHaveAttribute("data-status", "ok", { timeout: 15_000 })
    await expect(trace.getByRole("treeitem")).toHaveCount(6)
  })

  test("Agent Handoff shows who took over, and its context closes and opens", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/agent-handoff")
    const preview = await mountPreview(page, "agent-handoff-demo", "agent-handoff")
    const card = preview.getByRole("region", { name: "Handed off to Billing" })

    await expect(card).toHaveAttribute("data-status", "accepted")
    await expect(card).toContainText("Triage")
    await expect(card).toContainText("Refunds and invoices")
    await expect(card).toContainText("1,240 tokens")

    const context = card.locator('[data-slot="agent-handoff-context"]')
    await expect(context).toContainText("#48213 · $1,249.00")
    await expect(context).toContainText("order-48213.json")

    const toggle = card.getByRole("button", { name: "Hide context" })
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await toggle.focus()
    await page.keyboard.press("Enter")
    await expect(context).toHaveCount(0)
    const show = card.getByRole("button", { name: "Show context" })
    await expect(show).toHaveAttribute("aria-expanded", "false")
    await expect(show).toBeFocused()

    await expect(card.getByRole("button", { name: "View full context" })).toBeVisible()
    await expectNoAxeViolations(page, "agent-handoff-demo")
    expect(errors).toEqual([])
  })

  test("The inline handoff opens its context under the line", async ({ page }) => {
    await page.goto("/docs/ai/agent-handoff")
    const preview = await mountPreview(page, "agent-handoff-inline", "agent-handoff")
    const handoff = preview.getByRole("group", { name: /Handed off to Billing/ })
    const toggle = handoff.getByRole("button", { name: "Context" })

    await expect(toggle).toHaveAttribute("aria-expanded", "false")
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-expanded", "true")
    await expect(handoff.locator('[data-slot="agent-handoff-context"]')).toContainText("Open until December 12")
    await expect(handoff).toContainText("Refund on a delivered order needs the billing tools.")
    await expectNoAxeViolations(page, "agent-handoff-inline")
  })

  test("A pending handoff can be declined", async ({ page }) => {
    await page.goto("/docs/ai/agent-handoff")
    const preview = await mountPreview(page, "agent-handoff-pending", "agent-handoff")
    const card = preview.getByRole("region", { name: "Handing off to Legal review" })

    await expect(card).toHaveAttribute("data-status", "pending")
    await expect(card.getByRole("button", { name: "Accept" })).toBeVisible()
    await card.getByRole("button", { name: "Decline" }).click()

    const declined = preview.getByRole("region", { name: "Legal review declined the handoff" })
    await expect(declined).toHaveAttribute("data-status", "declined")
    await expect(declined.getByRole("button", { name: "Accept" })).toHaveCount(0)
    await expectNoAxeViolations(page, "agent-handoff-pending")
  })
})
