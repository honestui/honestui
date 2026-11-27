import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page

/**
 * Previews lazy-mount while scrolled near the viewport, so drive wheel
 * events until the named preview has rendered its component.
 */
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

test.describe("Component docs previews", () => {
  test("Thinking State closes when the run settles and reopens on request", async ({ page }) => {
    await page.goto("/docs/ai/thinking-state")
    const preview = await mountPreview(page, "thinking-state-demo", "thinking-state")
    const trigger = preview.locator('[data-slot="thinking-state-trigger"]')

    await expect(trigger).toHaveAttribute("aria-expanded", "true")

    await expect(trigger).toHaveText("Finished 4 steps", { timeout: 10_000 })
    await expect(trigger).toHaveAttribute("aria-expanded", "false")
    await expect(preview.getByRole("status")).toHaveText("Finished 4 steps")

    await trigger.focus()
    await page.keyboard.press("Enter")
    const steps = preview.locator('[data-slot="thinking-step"]')
    await expect(steps).toHaveCount(4)
    // Rows fade in; scan once they are fully opaque.
    await expect(steps.last()).toHaveCSS("opacity", "1")

    await expectNoAxeViolations(page)
  })

  test("Tool Chips opens call output and file diffs from the keyboard", async ({ page }) => {
    await page.goto("/docs/ai/tool-chips")
    const preview = await mountPreview(page, "tool-chips-demo", "tool-chips")

    await preview.getByRole("button", { name: /^Edit/ }).focus()
    await page.keyboard.press("Enter")
    await expect(preview.getByText("return roundTotal(total)")).toBeVisible()

    const chips = preview.locator('[data-slot="tool-chips-change"]')
    await expect(chips).toHaveCount(3)
    await preview.getByRole("button", { name: "Show 1 more" }).click()
    await expect(chips).toHaveCount(4)

    await preview.getByRole("button", { name: /^export\.test\.ts/ }).focus()
    await page.keyboard.press("Enter")
    const diff = page.getByRole("dialog", { name: "Changes to export.test.ts" })
    await expect(diff).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(diff).toBeHidden()

    await expectNoAxeViolations(page)
  })

  test("Approval Card sends every answer, and only on Send", async ({ page }) => {
    await page.goto("/docs/ai/approval-card")
    const preview = await mountPreview(page, "approval-card-demo", "approval-card")

    // A required question blocks Continue until it has an answer.
    await expect(preview.getByRole("button", { name: "Continue" })).toBeDisabled()
    await preview.getByRole("radio", { name: "Paid only" }).click()
    await expect(preview.getByText("Question 1 of 3")).toBeVisible()

    await preview.getByRole("button", { name: "Continue" }).click()
    await preview.getByRole("checkbox", { name: "Tax amount" }).click()
    await preview.getByRole("button", { name: "Continue" }).click()
    await preview.getByRole("button", { name: "Back" }).click()
    await expect(preview.getByRole("checkbox", { name: "Tax amount" })).toBeChecked()

    await preview.getByRole("button", { name: "Continue" }).click()
    await preview.getByRole("button", { name: "Send" }).click()

    await expect(preview.getByRole("status")).toHaveText("Answers sent.")
    await expect(preview.locator('[data-slot="approval-card"]')).toBeFocused()
    expect(JSON.parse((await preview.locator("pre").textContent()) ?? "")).toEqual({
      scope: { selected: ["paid"], custom: "" },
      columns: { selected: ["tax"], custom: "" },
      format: { selected: [], custom: "" },
    })

    await expectNoAxeViolations(page)
  })

  test("Approval Card keeps the answer when a send fails", async ({ page }) => {
    await page.goto("/docs/ai/approval-card")
    const preview = await mountPreview(page, "approval-card-failure", "approval-card")
    const choice = preview.getByRole("radio", { name: "Run it on staging" })

    await choice.click()
    await preview.getByRole("button", { name: "Send" }).click()

    await expect(preview.getByRole("alert")).toContainText("The answers were not sent.")
    await expect(choice).toBeChecked()

    await preview.getByRole("button", { name: "Send" }).click()
    await expect(preview.getByRole("status")).toHaveText("Answer sent. The agent will continue.")
  })

  test("Prompt Bar inserts suggestions and submits text, files, and model", async ({ page }) => {
    await page.goto("/docs/ai/prompt-bar")
    const preview = await mountPreview(page, "prompt-bar-demo", "prompt-bar")
    const input = preview.getByRole("textbox", { name: "Prompt" })
    const options = preview.getByRole("option")

    await expect(preview.getByRole("button", { name: "Send" })).toBeDisabled()

    await input.click()
    await page.keyboard.type("Check @in")
    await expect(options).toHaveCount(2)
    // Enter picks the active suggestion; it must not send.
    await page.keyboard.press("Enter")
    await expect(input).toHaveValue("Check @invoices ")

    await page.keyboard.type("then /")
    await expect(options).toHaveCount(3)
    await page.keyboard.press("Escape")
    await expect(options).toHaveCount(0)
    await page.keyboard.type("pl")
    await page.keyboard.press("Tab")
    await expect(input).toHaveValue("Check @invoices then /plan ")

    await preview.locator('input[type="file"]').setInputFiles({
      name: "q3-invoices.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("id,total\n1,10.01\n"),
    })
    await preview.getByRole("button", { name: /^Model/ }).click()
    await page.getByRole("menuitemradio", { name: /Sample Small/ }).click()

    await input.focus()
    await page.keyboard.press("Enter")

    await expect(preview.locator("dd")).toHaveText([
      "Check @invoices then /plan",
      "sample-small",
      "q3-invoices.csv",
    ])
    await expect(input).toHaveValue("")

    await expectNoAxeViolations(page)
  })
})

test.describe("Component docs previews, second set", () => {
  test("Streaming Text offers its actions only once the reply settles", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/ai/streaming-text")
    const preview = await mountPreview(page, "streaming-text-demo", "streaming-text")
    const reply = preview.locator('[data-slot="streaming-text"]')
    const received = preview.getByRole("status").last()

    await expect(reply).toHaveAttribute("data-status", "complete", { timeout: 15_000 })
    await expect(preview.locator('[data-slot="streaming-text-caret"]')).toHaveCount(0)

    await preview.getByRole("button", { name: "Copy reply" }).click()
    await expect(reply.getByRole("status")).toHaveText("Copied")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("at least 3:1")

    const helpful = preview.getByRole("button", { name: "Helpful", exact: true })
    await helpful.click()
    await expect(helpful).toHaveAttribute("aria-pressed", "true")
    await expect(received).toHaveText('onFeedbackChange received "up"')
    // Pressing the chosen rating again clears it.
    await helpful.click()
    await expect(received).toHaveText("onFeedbackChange received null")

    await preview.getByRole("button", { name: "2 sources" }).click()
    await expect(preview.getByRole("link", { name: /Understanding Focus Appearance/ })).toBeVisible()

    await preview.getByRole("button", { name: "Which tokens fail that ratio?" }).click()
    await expect(received).toHaveText("onSelect received “Which tokens fail that ratio?”")

    await expectNoAxeViolations(page)

    // Try again returns to streaming, where no action is offered.
    await preview.getByRole("button", { name: "Try again" }).click()
    await expect(reply).toHaveAttribute("data-status", "streaming")
    await expect(preview.getByRole("button", { name: "Copy reply" })).toHaveCount(0)
  })

  test("Streaming Text keeps partial text on an error and shows only handled actions", async ({ page }) => {
    await page.goto("/docs/ai/streaming-text")
    const preview = await mountPreview(page, "streaming-text-error", "streaming-text")

    await expect(preview.getByRole("alert")).toHaveText("The connection dropped, so this reply is incomplete.")
    await expect(preview.getByText("The migration adds a region column and then")).toBeVisible()
    await expect(preview.getByRole("button", { name: "Helpful", exact: true })).toHaveCount(0)
    await expect(preview.getByRole("button", { name: "Copy reply" })).toHaveCount(0)

    await preview.getByRole("button", { name: "Try again" }).click()
    await expect(preview.getByText("backfills 1,204 rows.")).toBeVisible()
    await expect(preview.getByRole("alert")).toHaveCount(0)
  })

  test("Task Rows opens details and retries a failed task", async ({ page }) => {
    await page.goto("/docs/ai/task-rows")
    const preview = await mountPreview(page, "task-rows-demo", "task-rows")
    const failed = preview.locator('[data-slot="task-row"]', { hasText: "Draft supplier emails" })

    await preview.getByRole("button", { name: /Verify vendor records/ }).click()
    await expect(preview.getByText("Matched tax and contact IDs")).toBeVisible()

    await expect(failed).toHaveAttribute("data-status", "error")
    await preview.getByRole("button", { name: "Try again: Draft supplier emails" }).click()
    await expect(failed).toHaveAttribute("data-status", "running")
    await expect(failed.locator('[data-slot="task-status"]')).toHaveText("Running")

    await expectNoAxeViolations(page)
  })

  test("Code View numbers a diff by the new file and copies it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/ai/code-view")
    const preview = await mountPreview(page, "code-view-diff", "code-view")

    // The removed line takes no number, so the two added lines are 2 and 3.
    await expect(preview.locator('[data-kind="removed"] > span').first()).toHaveText("")
    await expect(preview.locator('[data-kind="added"] > span:first-child')).toHaveText(["2", "3"])

    await preview.getByRole("button", { name: "Copy" }).click()
    await expect(preview.getByRole("status")).toHaveText("Copied")
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain("return roundTotal(total)")
    expect(copied).not.toContain("roundRow")

    await expectNoAxeViolations(page)
  })

  test("Search List filters and reports the chosen item", async ({ page }) => {
    await page.goto("/docs/ai/search-list")
    const preview = await mountPreview(page, "search-list-demo", "search-list")
    const field = preview.getByRole("combobox", { name: "Search saved prompts" })

    await field.fill("tests")
    await expect(preview.getByRole("option")).toHaveCount(1)
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")
    await expect(preview.getByText("onSelect received “Write tests for this file”")).toBeVisible()

    await field.fill("zzz")
    await expect(preview.getByText("No results. Try a different search.")).toBeVisible()
  })

  test("Filter Table counts match the rows it shows", async ({ page }) => {
    await page.goto("/docs/ai/filter-table")
    const preview = await mountPreview(page, "filter-table-demo", "filter-table")
    const bodyRows = preview.locator("tbody tr")

    await expect(bodyRows).toHaveCount(5)
    await preview.getByRole("button", { name: "In progress 2" }).click()
    await expect(bodyRows).toHaveCount(2)
    await expect(preview.getByRole("status")).toHaveText("Showing 2 of 5 rows")

    await preview.getByRole("button", { name: "Blocked 0" }).click()
    await expect(preview.getByText("No rows match this filter.")).toBeVisible()

    await expectNoAxeViolations(page)
  })

  test("Recommendation Card accepts the option the person picked", async ({ page }) => {
    await page.goto("/docs/ai/recommendation-card")
    const preview = await mountPreview(page, "recommendation-card-demo", "recommendation-card")

    await preview.getByRole("button", { name: "Alternatives" }).click()
    await preview.getByRole("button", { name: /Store amounts as integer cents/ }).click()
    await preview.getByRole("button", { name: "Draft the migration" }).click()

    await expect(preview.getByText("onAccept received “decimal”")).toBeVisible()
    await expect(preview.locator('[data-slot="recommendation-card"]')).toHaveAttribute("data-phase", "accepted")

    await expectNoAxeViolations(page)
  })

  test("Chat Thread adds a sent prompt to the log", async ({ page }) => {
    await page.goto("/docs/ai/chat-thread")
    const preview = await mountPreview(page, "chat-thread-demo", "chat-thread")
    const log = preview.getByRole("log", { name: "Conversation with the billing agent" })

    await preview.getByRole("textbox", { name: "Prompt" }).fill("Which invoices are affected?")
    await page.keyboard.press("Enter")

    await expect(log.locator('[data-slot="chat-message"]')).toHaveCount(3)
    await expect(log.locator('[data-slot="chat-message"]').last()).toContainText("Which invoices are affected?")

    await expectNoAxeViolations(page)
  })

  test("Diff Table applies only the changes left selected", async ({ page }) => {
    await page.goto("/docs/ai/diff-table")
    const preview = await mountPreview(page, "diff-table-demo", "diff-table")

    await expect(preview.getByRole("button", { name: "Apply 3 changes" })).toBeVisible()
    await preview.getByRole("checkbox", { name: "Include removing fax_number" }).click()
    await preview.getByRole("button", { name: "Apply 2 changes" }).click()

    await expect(preview.getByText("onApply received: legacy, region")).toBeVisible()
    await expect(preview.getByText("2 changes applied.")).toBeVisible()

    await expectNoAxeViolations(page)
  })

  test("Fine-tune Card reports values and resets to the defaults", async ({ page }) => {
    await page.goto("/docs/ai/fine-tune-card")
    const preview = await mountPreview(page, "fine-tune-card-demo", "fine-tune-card")
    const variety = preview.getByRole("textbox", { name: "Variety" })

    await variety.focus()
    await page.keyboard.press("ArrowUp")
    await expect(preview.getByText('"temperature":45')).toBeVisible()
    await expect(preview.getByRole("status")).toHaveText("Edited")

    await preview.getByRole("button", { name: "Reset" }).click()
    await expect(preview.getByText('"temperature":40')).toBeVisible()

    await expectNoAxeViolations(page)
  })

  test("Agent Screen opens its viewer and returns focus on close", async ({ page }) => {
    await page.goto("/docs/ai/agent-screen")
    const preview = await mountPreview(page, "agent-screen-demo", "agent-screen")
    const frame = preview.getByRole("button", { name: "Open: Research agent's screen" })

    await frame.focus()
    await page.keyboard.press("Enter")
    const viewer = page.getByRole("dialog", { name: "Research agent's screen" })
    await expect(viewer.getByRole("img", { name: /A CRM workspace/ })).toBeVisible()
    await expect(viewer.getByRole("button", { name: "Take over" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(viewer).toBeHidden()
    await expect(frame).toBeFocused()
  })

  test("Selection Actions moves from working to a keep or discard decision", async ({ page }) => {
    await page.goto("/docs/ai/selection-actions")
    const preview = await mountPreview(page, "selection-actions-demo", "selection-actions")
    const bar = preview.getByRole("toolbar", { name: "Edit selection" })

    await bar.getByRole("button", { name: "Shorten" }).click()
    await expect(bar).toHaveAttribute("data-status", "working")
    await expect(bar).toHaveAttribute("data-status", "result")
    await expect(preview.locator("mark")).toHaveText("Round once, after summing.")

    await bar.getByRole("button", { name: "Discard" }).click()
    await expect(preview.locator("mark")).toContainText("Round the total once after the rows")

    await expectNoAxeViolations(page)
  })

  test("Sidebar Nav filters chats and keeps names when collapsed", async ({ page }) => {
    await page.goto("/docs/ai/sidebar-nav")
    const preview = await mountPreview(page, "sidebar-nav-demo", "sidebar-nav")
    const nav = preview.getByRole("navigation", { name: "Workspace" })

    await nav.getByRole("searchbox", { name: "Search chats" }).fill("migration")
    await expect(nav.getByRole("button", { name: "Staging migration plan" })).toBeVisible()
    await expect(nav.getByRole("button", { name: "Focus ring contrast" })).toHaveCount(0)

    await nav.getByRole("button", { name: "Collapse sidebar" }).click()
    await expect(nav.getByRole("button", { name: "Files" })).toBeVisible()
    await expect(nav.getByRole("searchbox")).toHaveCount(0)

    await expectNoAxeViolations(page)
  })

  test("Insight Cards moves between cards and stops at the ends", async ({ page }) => {
    await page.goto("/docs/ai/insight-cards")
    const preview = await mountPreview(page, "insight-cards-demo", "insight-cards")
    const previous = preview.getByRole("button", { name: "Previous insight" })

    await expect(previous).toHaveAttribute("aria-disabled", "true")
    await preview.getByRole("button", { name: "Next insight" }).click()
    await expect(preview.getByText("2 of 3")).toBeVisible()
    await expect(preview.getByText("Two suppliers account for 71% of late invoices.")).toBeVisible()
    // A new card fades in; check contrast once it has finished.
    await expect(preview.locator('[data-slot="insight-card"]').locator("..")).toHaveCSS("opacity", "1")

    await expectNoAxeViolations(page)
  })

  test("Records Table fills cells, shows the failure, and retries it", async ({ page }) => {
    await page.goto("/docs/ai/records-table")
    const preview = await mountPreview(page, "records-table-demo", "records-table")
    const progress = preview.getByRole("status")

    await expect(progress).toHaveText("2 of 3 generated cells done", { timeout: 15_000 })
    await preview.getByRole("button", { name: "Try again: Payment summary for Harbor Paper Co." }).click()
    await expect(progress).toHaveText("3 of 3 generated cells done")
    await expect(preview.getByText("One invoice 14 days late.")).toBeVisible()

    await expectNoAxeViolations(page)
  })

  test("Loading State patterns preserve status, layout, and reduced motion", async ({ page }) => {
    await page.goto("/docs/ai/loading-state")
    const preview = await mountPreview(page, "loading-state-patterns", "loading-state")
    const marks = preview.locator('[data-slot="loading-state-mark"]')
    await expect(marks).toHaveCount(7)
    await expect(preview.getByRole("status")).toHaveCount(7)
    await expect(preview.getByRole("status").last()).toHaveText("Drafting the reply")

    for (const mark of await marks.all()) {
      await expect(mark).toHaveAttribute("aria-hidden", "true")
      await expect(mark).toHaveCSS("width", "16px")
      await expect(mark).toHaveCSS("height", "16px")
    }

    const pulse = marks.filter({ has: page.locator(".hui-loading-cell") }).last()
    await expect(pulse.locator(".hui-loading-cell").first()).toHaveCSS("animation-name", "hui-loading-pulse")
    await page.emulateMedia({ reducedMotion: "reduce" })
    for (const cell of await preview.locator(".hui-loading-cell, .beui-text-shimmer").all()) {
      await expect(cell).toHaveCSS("animation-name", "none")
    }

    await page.setViewportSize({ width: 320, height: 720 })
    await expect(preview.getByRole("status").last()).toBeVisible()
    await expectNoAxeViolations(page)
  })

  for (const [slug, slot] of [
    ["loading-state", "loading-state"],
    ["context-cards", "context-cards"],
    ["flowchart", "flowchart"],
  ] as const) {
    test(`${slug} renders with no detectable accessibility violations`, async ({ page }) => {
      await page.goto(`/docs/ai/${slug}`)
      await mountPreview(page, `${slug}-demo`, slot)
      await expectNoAxeViolations(page)
    })
  }
})

test.describe("Component docs previews, third set", () => {
  test("Prompt Bar stops a reply without sending the draft", async ({ page }) => {
    await page.goto("/docs/ai/prompt-bar")
    const preview = await mountPreview(page, "prompt-bar-stop", "prompt-bar")
    const input = preview.getByRole("textbox", { name: "Prompt" })
    const stop = preview.getByRole("button", { name: "Stop" })

    await input.fill("Summarize the thread")
    await page.keyboard.press("Enter")
    await expect(stop).toBeVisible()
    await expect(preview.getByRole("button", { name: "Send" })).toHaveCount(0)

    // A draft can be written during a reply. Enter must not send it, and neither must Stop.
    await input.fill("Next question")
    await page.keyboard.press("Enter")
    await expect(preview.getByRole("status")).toContainText("Summarize the thread")

    await stop.focus()
    await page.keyboard.press("Enter")
    await expect(preview.getByRole("status")).toHaveText("onStop ran. The reply was stopped.")
    await expect(input).toHaveValue("Next question")
    await expect(input).toBeFocused()
    await expect(preview.getByRole("button", { name: "Send" })).toBeEnabled()

    await expectNoAxeViolations(page)
  })

  test("Markdown never shows half-written syntax while it streams", async ({ page }) => {
    await page.goto("/docs/ai/markdown")
    const preview = await mountPreview(page, "markdown-demo", "markdown")
    const reply = preview.locator('[data-slot="streaming-text"]')
    const markdown = preview.locator('[data-slot="markdown"]')

    // Sample the text until the reply settles. Emphasis and code markers must never be visible.
    const seenWhileStreaming: string[] = []
    while ((await reply.getAttribute("data-status")) === "streaming") {
      seenWhileStreaming.push(await markdown.innerText())
      await page.waitForTimeout(60)
    }
    expect(seenWhileStreaming.length).toBeGreaterThan(5)
    expect(seenWhileStreaming.filter((text) => /\*\*|`/.test(text))).toEqual([])

    await expect(preview.locator('[data-slot="markdown-caret"]')).toHaveCount(0)
    await expect(markdown.locator("strong")).toHaveText("before")
    await expect(markdown.getByRole("row")).toHaveCount(3)
    await expect(markdown.getByRole("listitem")).toHaveCount(2)
    const code = markdown.locator('[data-slot="prose-code-block"]')
    await expect(code).toContainText("return roundTotal(total)")
    await expect(code.getByRole("button", { name: "Copy" })).toBeVisible()

    await expectNoAxeViolations(page)
  })

  test("Markdown shows an image as a link and requests nothing", async ({ page }) => {
    const imageRequests: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("example.com")) imageRequests.push(request.url())
    })

    await page.goto("/docs/ai/markdown")
    const preview = await mountPreview(page, "markdown-static", "markdown")

    await expect(preview.getByRole("link", { name: "Drift per export, by month" })).toHaveAttribute(
      "href",
      "https://example.com/drift.png"
    )
    await expect(preview.locator("img")).toHaveCount(0)
    await expect(preview.getByRole("checkbox", { name: "Done", exact: true })).toHaveCount(2)
    await expect(preview.getByRole("checkbox", { name: "Not done" })).toHaveCount(1)
    expect(imageRequests).toEqual([])

    await expectNoAxeViolations(page)
  })

  test("Markdown holds a streaming component block and then renders the validated flowchart", async ({ page }) => {
    await page.goto("/docs/ai/markdown")
    const preview = await mountPreview(page, "markdown-blocks", "markdown")
    await expect(preview.locator('[data-slot="markdown-block-pending"]')).toBeVisible()
    await expect(preview.locator('[data-slot="markdown-block"]')).toHaveCount(0)
    await expect(preview.getByRole("list", { name: "Invoice follow-up workflow" })).toBeVisible({ timeout: 15_000 })
    await expect(preview.locator('[data-slot="markdown-block-pending"]')).toHaveCount(0)
    await expect(preview).toContainText("Draft a reminder email")
    await expectNoAxeViolations(page)
  })

  test("Markdown add-ons render math, highlight code, and download the named source", async ({ page }) => {
    await page.goto("/docs/ai/markdown")
    const preview = await mountPreview(page, "markdown-add-ons", "markdown")
    await expect(preview.locator(".katex")).toHaveCount(2)
    await expect(preview).toContainText("$5")
    const code = preview.locator('[data-slot="prose-code-block"]')
    await expect(code).toContainText("export.ts")
    await expect(code.locator('.prose-syntax-keyword').first()).toBeVisible()
    await code.getByRole("button", { name: "Download" }).focus()
    const downloaded = page.waitForEvent("download")
    await page.keyboard.press("Enter")
    expect((await downloaded).suggestedFilename()).toBe("export.ts")
    await expectNoAxeViolations(page)
  })

  test("Prose variables respond to keyboard controls", async ({ page }) => {
    await page.goto("/docs/ai/prose")
    const preview = await mountPreview(page, "prose-demo", "prose-demo")
    const size = preview.getByRole("slider", { name: "Size", exact: true })
    await size.focus()
    await page.keyboard.press("ArrowRight")
    await expect(size).toHaveValue("15")
    await expect(preview.locator('[data-slot="prose-demo"]')).toHaveCSS("font-size", "15px")
    await expectNoAxeViolations(page)
  })

  test("Prose presets, advanced overrides, reset, and CSS export work together", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/ai/prose")
    const preview = await mountPreview(page, "prose-demo", "prose-demo")
    const article = preview.locator('[data-slot="prose-demo"]')
    await preview.getByRole("combobox", { name: "Preset", exact: true }).click()
    await page.getByRole("option", { name: "Document", exact: true }).click()
    await expect(article).toHaveCSS("font-size", "16px")
    await expect(article).toHaveCSS("line-height", "27.2px")
    await preview.getByText("Advanced", { exact: true }).click()
    const color = preview.getByLabel("Text color", { exact: true })
    await color.fill("invalid")
    await expect(color).toHaveAttribute("aria-invalid", "true")
    await expect(preview.getByRole("button", { name: "Copy CSS", exact: true })).toBeDisabled()
    await color.fill("#334155")
    await expect(article).toHaveCSS("color", "rgb(51, 65, 85)")
    await preview.getByRole("combobox", { name: "Code font", exact: true }).click()
    await page.getByRole("option", { name: "Consolas", exact: true }).click()
    await preview.getByRole("button", { name: "Copy CSS", exact: true }).click()
    await expect(preview.locator('p[role="status"]')).toHaveText("CSS copied.")
    const css = await page.evaluate(() => navigator.clipboard.readText())
    expect(css).toContain("--prose-width: 68ch;")
    expect(css).toContain("--prose-color: #334155;")
    expect(css).toContain("--prose-font-mono: Consolas, monospace;")
    await preview.getByRole("button", { name: "Reset", exact: true }).click()
    await expect(article).toHaveCSS("font-size", "14px")
    await expect(color).toHaveValue("")
    await expect(preview.getByRole("combobox", { name: "Code font", exact: true })).toContainText("Theme default")
    await expectNoAxeViolations(page)
    await page.setViewportSize({ width: 320, height: 800 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test("Tailwind Prose matches the CSS preview and exports complete classes without a stylesheet dependency", async ({ page, context, request }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/ai/prose")
    const preview = await mountPreview(page, "prose-demo", "prose-demo")
    const article = preview.locator('[data-slot="prose-demo"]')
    await article.evaluate((node) => node.insertAdjacentHTML("beforeend", '<h1>Title</h1><h2>Overview</h2><h3>Section</h3><h4>Detail</h4><h5>Note</h5><h6>Label</h6><ol><li><p>Nested paragraph</p><ul><li>Nested item</li></ul></li></ol><ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" disabled aria-label="Task">Task</li></ul><dl><dt>Term</dt><dd>Description</dd></dl><p><kbd>Enter</kbd> and <samp>Output</samp></p><hr><pre><code>const x = 1</code></pre><figure><figcaption>Caption</figcaption></figure><section class="not-prose"><p style="margin:13px;font-size:21px">Embedded component</p></section>'))
    const styles = () => article.evaluate((node) => [node, ...node.querySelectorAll("*")].map((element) => {
      const computed = getComputedStyle(element)
      return Object.fromEntries(["font-size", "font-family", "font-weight", "line-height", "margin-top", "margin-bottom", "padding-inline-start", "color", "background-color", "list-style-type", "border-top-width"].map((name) => [name, computed.getPropertyValue(name)]))
    }))
    await expect(article.locator(".prose-syntax-keyword").first()).toBeVisible()
    const expected = await styles()
    await preview.getByRole("combobox", { name: "Export", exact: true }).click()
    await page.getByRole("option", { name: "Tailwind", exact: true }).click()
    await expect(article).not.toHaveClass(/honest-prose/)
    expect(await styles()).toEqual(expected)
    await preview.getByRole("button", { name: "Copy Tailwind classes", exact: true }).click()
    const classes = await page.evaluate(() => navigator.clipboard.readText())
    expect(classes).toContain("[--prose-size:14px]")
    expect(classes).toContain("[font-size:var(--prose-internal-size)]!")
    const item = await (await request.get("/r/ai/prose-tailwind.json")).json()
    expect(item.files[0].target).toBe("lib/prose-tailwind.ts")
    expect(item.dependencies).toBeUndefined()
    expect(item.registryDependencies).toBeUndefined()
    await expectNoAxeViolations(page)
    await page.setViewportSize({ width: 320, height: 800 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test("Prose works without theme tokens, reflows, and leaves embedded component text alone", async ({ page, request }) => {
    const item = await (await request.get("/r/ai/prose.json")).json()
    await page.setViewportSize({ width: 320, height: 720 })
    await page.setContent(`<!doctype html><html lang="en"><head><title>Prose test</title><style>
      ${item.files[0].content}
      body { margin: 16px; color: #111; background: #fff; }
      .embedded p { margin: 7px; font-size: 20px; }
    </style></head><body><main><article class="honest-prose">
      <h1>Standalone Markdown</h1><p>A long link: <a href="https://example.com">${"long".repeat(35)}</a></p>
      <blockquote><p>A readable quote.</p></blockquote>
      <div class="not-prose embedded"><p>Component-owned text</p></div>
      <pre tabindex="0" aria-label="Code"><code>${"long code ".repeat(30)}</code></pre>
    </article></main></body></html>`)
    await expect(page.locator(".embedded p")).toHaveCSS("margin-top", "7px")
    await expect(page.locator(".embedded p")).toHaveCSS("font-size", "20px")
    await expect(page.locator("a")).toHaveCSS("text-decoration-line", "underline")
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.locator("pre").focus()
    await page.keyboard.press("ArrowRight")
    await expect.poll(() => page.locator("pre").evaluate((node) => node.scrollLeft)).toBeGreaterThan(0)
    for (const dark of [false, true]) {
      await page.locator("body").evaluate((node, isDark) => { node.style.color = isDark ? "#eee" : "#111"; node.style.background = isDark ? "#111" : "#fff" }, dark)
      const results = await new AxeBuilder({ page }).include(".honest-prose").analyze()
      expect(results.violations.map((violation) => violation.id)).toEqual([])
    }
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" })
    await page.locator("a").focus()
    await expect(page.locator("a")).toBeFocused()
    await page.addStyleTag({ content: "* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }" })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test("Chat Thread edits a message into a new version and moves between versions", async ({ page }) => {
    await page.goto("/docs/ai/chat-thread")
    const preview = await mountPreview(page, "chat-thread-editing", "chat-thread")
    const message = preview.locator('[data-slot="chat-message"][data-role="user"]')

    await expect(message.getByRole("list", { name: "Attachments" }).getByRole("listitem")).toHaveCount(2)
    await expect(message.getByText("2 of 2")).toBeVisible()

    await message.getByRole("button", { name: "Previous version" }).click()
    await expect(message.getByText("1 of 2")).toBeVisible()
    await expect(message).toContainText("Why are export totals off?")

    await message.getByRole("button", { name: "Edit message" }).focus()
    await page.keyboard.press("Enter")
    const editor = message.getByRole("textbox", { name: "Message" })
    await expect(editor).toBeFocused()
    await expect(editor).toHaveValue("Why are export totals off?")

    // Escape discards the change and returns focus to Edit.
    await editor.fill("Discarded")
    await page.keyboard.press("Escape")
    await expect(message.getByRole("button", { name: "Edit message" })).toBeFocused()
    await expect(message).toContainText("Why are export totals off?")

    await page.keyboard.press("Enter")
    await editor.fill("Why are export totals off by two cents?")
    await page.keyboard.press("Enter")
    await expect(message.getByText("3 of 3")).toBeVisible()
    await expect(message).toContainText("Why are export totals off by two cents?")
    await expect(message.getByRole("button", { name: "Next version" })).toHaveAttribute("aria-disabled", "true")

    await expectNoAxeViolations(page)
  })

  test("Chat Thread keeps an edit that failed to send", async ({ page }) => {
    await page.goto("/docs/ai/chat-thread")
    const preview = await mountPreview(page, "chat-thread-edit-failure", "chat-thread")

    await preview.getByRole("button", { name: "Edit message" }).click()
    const editor = preview.getByRole("textbox", { name: "Message" })
    await editor.fill("Summarize the Q3 invoices by supplier.")
    await preview.getByRole("button", { name: "Send" }).click()

    await expect(preview.getByRole("alert")).toHaveText("The edit was not sent. Your changes are still here.")
    await expect(editor).toHaveValue("Summarize the Q3 invoices by supplier.")

    await preview.getByRole("button", { name: "Send" }).click()
    await expect(editor).toHaveCount(0)
    await expect(preview.locator('[data-slot="chat-message"]')).toContainText("Summarize the Q3 invoices by supplier.")
  })

  test("Context Meter reports each threshold and opens the exact counts", async ({ page }) => {
    await page.goto("/docs/ai/context-meter")
    const preview = await mountPreview(page, "context-meter-demo", "context-meter")
    const meter = preview.locator('[data-slot="context-meter"]')
    const addFile = preview.getByRole("button", { name: "Add a 40,000-token file" })

    await expect(meter).toHaveAccessibleName("42% of context used")
    await expect(meter).toHaveAttribute("data-status", "ok")

    await addFile.click()
    await addFile.click()
    // The name changes at once. The visible number arrives after it has counted up.
    await expect(meter).toHaveAccessibleName("82% of context used. Near the limit")
    await expect(meter.locator('[data-slot="context-meter-percent"]')).toHaveText("82%")
    await expect(meter).toHaveAttribute("data-status", "near")

    await addFile.click()
    await expect(meter).toHaveAccessibleName("102% of context used. At the limit")
    await expect(meter).toHaveAttribute("data-status", "full")

    await meter.focus()
    await page.keyboard.press("Enter")
    const details = page.getByRole("dialog", { name: "Context window" })
    await expect(details.getByRole("meter")).toHaveAttribute("aria-valuetext", "204,200 of 200,000 tokens")
    await expect(details).toContainText("0 left")
    await expect(details).toContainText("140,800")
    await expect(details).toContainText("$0.42")

    // Check contrast once the popover has faded in, not partway through the fade.
    await expect(page.locator('[data-slot="popover-content"]')).toHaveCSS("opacity", "1")
    const results = await new AxeBuilder({ page }).include('[data-slot="popover-content"]').analyze()
    expect(results.violations.map((violation) => violation.id)).toEqual([])

    await page.keyboard.press("Escape")
    await expect(details).toBeHidden()
    await expect(meter).toBeFocused()

    await expectNoAxeViolations(page)
  })

  test("Context Meter can show the ring alone and still names the figure", async ({ page }) => {
    await page.goto("/docs/ai/context-meter")
    const preview = await mountPreview(page, "context-meter-ring", "context-meter")
    const meter = preview.locator('[data-slot="context-meter"]')

    await expect(meter.locator('[data-slot="context-meter-percent"]')).toHaveCount(0)
    await expect(meter).toHaveAccessibleName("24% of context used")

    await preview.getByRole("button", { name: "Add 30,000 tokens" }).click()
    await expect(meter).toHaveAccessibleName("39% of context used")

    await expectNoAxeViolations(page)
  })

  test("Artifact Panel opens from its card, takes focus, and hands it back on close", async ({ page }) => {
    await page.goto("/docs/ai/artifact-panel")
    const preview = await mountPreview(page, "artifact-panel-demo", "artifact-panel")
    const card = preview.locator('[data-slot="artifact-card"]')
    const panel = preview.getByRole("region", { name: "export.ts" })

    await expect(card).toHaveAttribute("aria-expanded", "true")
    await expect(panel).toContainText("return roundTotal(total)")
    await expectNoAxeViolations(page)

    await panel.getByRole("button", { name: "Close" }).click()
    await expect(panel).toHaveCount(0)
    await expect(card).toBeFocused()
    await expect(card).toHaveAttribute("aria-expanded", "false")
    await expect(card).toContainText("Open")

    await page.keyboard.press("Enter")
    await expect(panel).toBeFocused()
  })

  test("Artifact Panel keeps a partial draft on an error and retries it", async ({ page }) => {
    await page.goto("/docs/ai/artifact-panel")
    const preview = await mountPreview(page, "artifact-panel-error", "artifact-panel")
    const panel = preview.locator('[data-slot="artifact-panel"]')

    await expect(panel.getByRole("alert")).toContainText("The connection dropped, so this draft is incomplete.")
    await expect(panel).toContainText("Export totals are now rounded once, after")

    await panel.getByRole("button", { name: "Try again" }).click()
    await expect(panel.getByRole("status")).toHaveText("Writing…")
    await expect(panel).toHaveAttribute("data-status", "complete")
    await expect(panel).toContainText("change by one cent.")
    await expect(panel.getByRole("alert")).toHaveCount(0)

    await expectNoAxeViolations(page)
  })
})

test.describe("Site and registry", () => {
  test("the sidebar lists the components and nothing from Honest UI", async ({ page }) => {
    await page.goto("/docs/ai")
    const nav = page.getByRole("navigation", { name: "Documentation" })

    await expect(nav.getByRole("link", { name: /Prompt Bar/ })).toHaveAttribute("href", "/docs/ai/prompt-bar")
    await expect(nav.getByText("UI Components")).toHaveCount(0)
  })

  test("a registry item installs under components/ai and points its dependencies at the right registries", async ({ request }) => {
    const response = await request.get("/r/ai/chat-thread-demo.json")
    expect(response.status()).toBe(200)
    const example = await response.json()
    // An example imports a component from this registry.
    expect(example.registryDependencies.some((url: string) => /\/r\/ai\/prompt-bar\.json$/.test(url) && !url.includes("www.honestui.com"))).toBe(true)

    const item = await (await request.get("/r/ai/thinking-state.json")).json()
    expect(item.files[0].target).toBe("components/ai/thinking-state.tsx")
    // Honest UI items resolve from /r, on the same origin as this registry.
    expect(item.registryDependencies).toEqual([
      expect.stringMatching(/\/r\/collapsible\.json$/),
      expect.stringMatching(/\/r\/text-shimmer\.json$/),
    ])
    expect(item.dependencies).toEqual(["honestui"])
    expect(item.files[0].content).not.toContain("@/registry/")
  })

  test("the catalog lists components, utilities, and styles without examples", async ({ request }) => {
    const catalog = await (await request.get("/r/ai/registry.json")).json()
    const names = catalog.items.map((item: { name: string }) => item.name)

    expect(names).toContain("prompt-bar")
    expect(catalog.items.filter((item: { type: string }) => item.type === "registry:component")).toHaveLength(48)
    expect(catalog.items).toEqual(expect.arrayContaining([
      { name: "prose", type: "registry:file" },
      { name: "repair-markdown", type: "registry:lib" },
      { name: "markdown-math", type: "registry:lib" },
      { name: "markdown-shiki", type: "registry:lib" },
    ]))
    expect(names.some((name: string) => name.endsWith("-demo"))).toBe(false)
  })

  test("a component that uses another one depends on it from this registry", async ({ request }) => {
    const item = await (await request.get("/r/ai/markdown.json")).json()

    expect(item.dependencies).toEqual(["react-markdown", "remark-gfm"])
    // The code frame, Prose, repair, and the three syntax files the highlighter needs.
    expect(item.registryDependencies).toHaveLength(6)
    expect(item.registryDependencies.some((dependency: string) => /\/r\/ai\/prose-code-block\.json$/.test(dependency))).toBe(true)
    expect(item.registryDependencies.every((dependency: string) => !dependency.includes("www.honestui.com"))).toBe(true)
    expect(item.files[0].content).toContain("@/components/ai/prose-code-block")
    expect(item.files[0].content).toContain("@/lib/repair-markdown")
    expect(item.registryDependencies).toEqual(expect.arrayContaining([
      expect.stringMatching(/\/r\/ai\/repair-markdown\.json$/),
      expect.stringMatching(/\/r\/ai\/prose\.json$/),
    ]))
  })

  test("standalone styles and repair install without components, and add-ons include their packages", async ({ request }) => {
    const styles = await (await request.get("/r/ai/prose.json")).json()
    expect(styles.files[0]).toMatchObject({ type: "registry:file", target: "styles/prose.css" })
    expect(styles.dependencies).toBeUndefined()
    expect(styles.registryDependencies).toBeUndefined()
    const repair = await (await request.get("/r/ai/repair-markdown.json")).json()
    expect(repair.files[0].target).toBe("lib/repair-markdown.ts")
    expect(repair.dependencies).toBeUndefined()
    expect(repair.registryDependencies).toBeUndefined()
    const math = await (await request.get("/r/ai/markdown-math.json")).json()
    expect(math.dependencies).toEqual(["katex", "rehype-katex", "remark-math"])
    const shiki = await (await request.get("/r/ai/markdown-shiki.json")).json()
    expect(shiki.dependencies).toEqual(["shiki"])
    expect(shiki.files[0].content).not.toContain("@/registry/")
  })

  test("the Prose Markdown export includes its stylesheet source", async ({ request }) => {
    const response = await request.get("/docs/ai/prose.md")
    expect(response.status()).toBe(200)
    const source = await response.text()
    expect(source).toContain("```css")
    expect(source).toContain(".honest-prose {")
    expect(source).not.toContain('<ComponentSource name="prose"')
  })

  test("an unknown registry item is a 404 with a way forward", async ({ request }) => {
    const response = await request.get("/r/ai/not-a-component.json")
    expect(response.status()).toBe(404)
    expect((await response.json()).resolution).toContain("/r/ai/registry.json")
  })
})
