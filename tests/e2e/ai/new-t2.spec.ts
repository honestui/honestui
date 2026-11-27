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

test.describe("Eval compare and memory viewer", () => {
  test("Eval Compare scores, diffs against a baseline, votes, and switches cases", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/eval-compare")
    const preview = await mountPreview(page, "eval-compare-demo", "eval-compare")

    await expect(preview.getByRole("group", { name: "Comparison" })).toBeVisible()
    await expect(preview.locator('[data-slot="eval-compare-candidate"]')).toHaveCount(3)

    // The best value in a row is marked for everyone, not only by weight.
    const correctness = preview.locator('[data-slot="eval-compare-metric"]').filter({ hasText: "Correctness" })
    await expect(correctness.locator("[data-best]")).toHaveCount(1)
    await expect(correctness.locator("[data-best]")).toContainText("97%")
    await expect(correctness.locator("[data-best]")).toContainText("(Best)")
    const latency = preview.locator('[data-slot="eval-compare-metric"]').filter({ hasText: "Latency" })
    await expect(latency.locator("[data-best]")).toContainText("0.9 s")

    // A failed check is announced as failed.
    await expect(preview.getByText("1 of 3 checks passed").or(preview.getByText("0 of 3 checks passed")).first()).toBeVisible()

    // Differences compares each column with the first.
    const diffToggle = preview.getByRole("button", { name: "Differences" })
    await diffToggle.focus()
    await page.keyboard.press("Enter")
    await expect(diffToggle).toHaveAttribute("aria-pressed", "true")
    await expect(preview.locator('[data-slot="eval-compare-baseline"]')).toHaveCount(1)
    await expect(preview.locator("ins").first()).toBeVisible()
    await expect(preview.locator("del").first()).toBeVisible()

    // Choosing another baseline moves the badge.
    await preview.getByRole("button", { name: "Compare against Large · v4" }).click()
    const v4 = preview.locator('[data-slot="eval-compare-candidate"]').nth(2)
    await expect(v4).toHaveAttribute("data-baseline")

    // Votes are toggle buttons, and the vote is announced.
    const prefer = preview.getByRole("button", { name: "Prefer Large · v3" })
    await prefer.click()
    await expect(prefer).toHaveAttribute("aria-pressed", "true")
    await expect(preview.getByText("Preferred Large · v3.")).toBeVisible()
    await preview.getByRole("button", { name: "Tie" }).click()
    await expect(prefer).toHaveAttribute("aria-pressed", "false")

    // The case switcher.
    await expect(preview.getByRole("button", { name: "Previous case" })).toBeDisabled()
    await preview.getByRole("button", { name: "Next case" }).click()
    await expect(preview.getByText("Case 2 of 2")).toBeVisible()
    await expect(preview.getByText("How do I move a project to another workspace?")).toBeVisible()

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Eval Compare diff example counts changed words", async ({ page }) => {
    await page.goto("/docs/ai/eval-compare")
    const preview = await mountPreview(page, "eval-compare-diff", "eval-compare")
    await expect(preview.getByRole("button", { name: "Differences" })).toHaveAttribute("aria-pressed", "true")
    await expect(preview.getByText(/words added, \d+ removed/)).toBeVisible()
    await expectNoAxeViolations(page)
  })

  test("Memory Viewer searches, filters, edits, pins, and forgets with undo", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/memory-viewer")
    const preview = await mountPreview(page, "memory-viewer-demo", "memory-viewer")
    const items = preview.locator('[data-slot="memory-viewer-item"]')

    await expect(preview.getByRole("region", { name: "Memory" })).toBeVisible()
    await expect(items).toHaveCount(7)
    await expect(preview.getByText("Unsure, 38% sure")).toBeVisible()

    // Search marks matches and narrows the list.
    await preview.getByRole("searchbox", { name: "Search memories" }).fill("euros")
    await expect(items).toHaveCount(1)
    await expect(preview.locator("mark")).toHaveText("euros")
    await preview.getByRole("searchbox", { name: "Search memories" }).fill("zzz")
    await expect(preview.getByText("No memories match “zzz”.")).toBeVisible()
    await preview.getByRole("searchbox", { name: "Search memories" }).fill("")

    // Filter by group.
    const facts = preview.getByRole("button", { name: /^Facts/ })
    await facts.click()
    await expect(facts).toHaveAttribute("aria-pressed", "true")
    await expect(items).toHaveCount(2)
    await preview.getByRole("button", { name: /^All/ }).click()

    // Edit with the keyboard: Escape cancels, Enter saves, and focus returns to Edit.
    const edit = preview.getByRole("button", { name: "Edit: Works from Lisbon, usually between 9:00 and 17:30." })
    await edit.focus()
    await page.keyboard.press("Enter")
    const field = preview.getByRole("textbox", { name: "Edit memory" })
    await expect(field).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(field).toHaveCount(0)
    await edit.click()
    await field.fill("Works from Porto, usually between 9:00 and 17:30.")
    await page.keyboard.press("Enter")
    await expect(preview.getByText("Works from Porto, usually between 9:00 and 17:30.")).toBeVisible()
    await expect(preview.getByRole("button", { name: "Edit: Works from Porto, usually between 9:00 and 17:30." })).toBeFocused()

    // Pin moves a memory to the top of its group.
    await preview.getByRole("button", { name: "Pin: Prefers short answers with a table over long paragraphs." }).click()
    await expect(
      preview.locator('[data-slot="memory-viewer-item"][data-pinned]').filter({ hasText: "Prefers short answers" })
    ).toHaveCount(1)

    // Forget is immediate with Undo, and focus moves to Undo.
    await preview.getByRole("button", { name: "Forget: Wants totals in euros, with VAT shown separately." }).click()
    await expect(items).toHaveCount(6)
    const undo = preview.getByRole("button", { name: "Undo" })
    await expect(undo).toBeFocused()
    await expect(preview.getByText("Forgot 1 memory.")).toBeVisible()
    await page.keyboard.press("Enter")
    await expect(items).toHaveCount(7)

    // Bulk select and forget.
    await preview.getByRole("checkbox", { name: "Select all shown" }).click()
    await expect(preview.getByText("7 selected")).toBeVisible()
    await preview.getByRole("button", { name: "Forget 7" }).click()
    await expect(preview.getByText("Nothing remembered yet")).toBeVisible()
    await preview.getByRole("button", { name: "Undo" }).click()
    await expect(items).toHaveCount(7)

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Memory Viewer asks to confirm when forgetting cannot be undone", async ({ page }) => {
    await page.goto("/docs/ai/memory-viewer")
    const preview = await mountPreview(page, "memory-viewer-confirm", "memory-viewer")
    const items = preview.locator('[data-slot="memory-viewer-item"]')
    await expect(preview.getByRole("region", { name: "Team memory" })).toBeVisible()

    await preview.getByRole("button", { name: /^Forget: Payments code/ }).click()
    await expect(preview.getByText("Forget this? The agent won't use it again.")).toBeVisible()
    const confirm = preview.locator('[data-slot="memory-viewer-confirm"]').getByRole("button", { name: "Forget" })
    await expect(confirm).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(items).toHaveCount(3)
    await expect(preview.getByRole("button", { name: /^Forget: Payments code/ })).toBeFocused()

    await preview.getByRole("button", { name: /^Forget: Payments code/ }).click()
    await preview.locator('[data-slot="memory-viewer-confirm"]').getByRole("button", { name: "Forget" }).click()
    await expect(items).toHaveCount(2)
    await expect(preview.getByRole("button", { name: "Undo" })).toHaveCount(0)
    await expectNoAxeViolations(page)
  })
})
