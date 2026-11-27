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

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).include("[data-component-preview]").analyze()
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

test.describe("Developer views", () => {
  test("Web Preview loads a sandboxed page, switches widths, and opens its console", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/web-preview")
    const preview = await mountPreview(page, "web-preview-demo", "web-preview")
    const root = preview.locator('[data-slot="web-preview"]')
    const frame = preview.locator('[data-slot="web-preview-frame"]')

    await expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-forms")
    await expect(root).toHaveAttribute("data-status", "ready")
    await expect(preview.frameLocator("iframe").getByRole("heading", { name: "Ship invoices in one click" })).toBeVisible()

    await expect(root.getByRole("button", { name: "Back" })).toBeDisabled()
    await expect(root.getByRole("textbox", { name: "Address" })).toHaveValue("http://localhost:5173/waitlist")
    await expect(root.getByRole("textbox", { name: "Address" })).toHaveAttribute("readonly", "")

    const mobile = root.getByRole("button", { name: "Mobile" })
    await mobile.click()
    await expect(mobile).toHaveAttribute("aria-pressed", "true")
    await expect.poll(async () => (await frame.boundingBox())?.width).toBeLessThanOrEqual(391)

    await root.getByRole("button", { name: "Reload" }).click()
    await expect(root).toHaveAttribute("data-status", "ready")

    const consoleToggle = root.getByRole("button", { name: /Console/ })
    await expect(consoleToggle).toHaveAttribute("aria-expanded", "false")
    await consoleToggle.click()
    await expect(consoleToggle).toHaveAttribute("aria-expanded", "true")
    await expect(preview.getByText("Image is missing an alt attribute: hero.png")).toBeVisible()

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Web Preview shows an error with a way to try again", async ({ page }) => {
    await page.goto("/docs/ai/web-preview")
    const preview = await mountPreview(page, "web-preview-error", "web-preview")
    await expect(preview.getByRole("alert")).toContainText("The preview did not load")
    await expect(preview.getByRole("alert")).toContainText("port 5173")
    await expect(preview.getByRole("button", { name: "Try again" })).toBeVisible()
    await expectNoAxeViolations(page)
  })

  test("Terminal Output streams to an exit status and folds long output", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/terminal-output")
    const preview = await mountPreview(page, "terminal-output-demo", "terminal-output")
    const root = preview.locator('[data-slot="terminal-output"]')
    await expect(root).toHaveAttribute("data-state", "done", { timeout: 15_000 })
    await expect(preview.locator('[data-slot="terminal-output-status"]')).toContainText("Exit 0")
    await expect(preview.locator('[data-stream="stderr"]')).toHaveCount(1)
    await expect(preview.getByRole("status")).toHaveText("Command finished")

    const failure = await mountPreview(page, "terminal-output-failure", "terminal-output")
    await expect(failure.locator('[data-slot="terminal-output"]')).toHaveAttribute("data-state", "failed")
    await expect(failure.locator('[data-slot="terminal-output-status"]')).toContainText("Exit 1")
    const lines = failure.locator('[data-slot="terminal-output-lines"] > span')
    await expect(lines).toHaveCount(8)
    await failure.getByRole("button", { name: "Show 24 earlier lines" }).click()
    await expect(lines).toHaveCount(32)
    await expect(failure.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true")

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Terminal Output offers to jump to the latest line after scrolling up", async ({ page }) => {
    await page.goto("/docs/ai/terminal-output")
    const failure = await mountPreview(page, "terminal-output-failure", "terminal-output")
    await failure.getByRole("button", { name: "Show 24 earlier lines" }).click()
    const output = failure.getByRole("group", { name: "Output" })
    await expect(output).toHaveAttribute("tabindex", "0")
    await output.evaluate((node) => {
      node.scrollTop = 0
      node.dispatchEvent(new Event("scroll"))
    })
    const jump = failure.getByRole("button", { name: "Jump to latest" })
    await expect(jump).toBeVisible()
    await jump.click()
    await expect(jump).toBeHidden()
    await expect
      .poll(() => output.evaluate((node) => node.scrollHeight - node.scrollTop - node.clientHeight))
      .toBeLessThan(25)
  })

  test("File Tree follows the tree keyboard pattern and marks changes", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/file-tree")
    const preview = await mountPreview(page, "file-tree-demo", "file-tree")
    const tree = preview.getByRole("tree", { name: "honest-app" })
    await expect(tree).toBeVisible()

    const selected = tree.getByRole("treeitem", { selected: true })
    await expect(selected).toHaveAttribute("aria-level", "3")
    await expect(selected).toContainText("page.tsx")
    await expect(selected).toContainText("Added")
    await expect(tree.locator('[data-change="deleted"]')).toContainText("Deleted")

    // The chosen item holds the only tab stop.
    await expect(tree.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1)
    await selected.focus()

    await page.keyboard.press("ArrowLeft")
    const invoices = tree.getByRole("treeitem", { name: /^invoices/ })
    await expect(invoices).toBeFocused()
    await page.keyboard.press("ArrowLeft")
    await expect(invoices).toHaveAttribute("aria-expanded", "false")
    await expect(invoices).toContainText("Contains changes")
    await page.keyboard.press("ArrowRight")
    await expect(invoices).toHaveAttribute("aria-expanded", "true")

    await page.keyboard.press("Home")
    const app = tree.getByRole("treeitem", { name: /^app/ })
    await expect(app).toBeFocused()
    await page.keyboard.press("End")
    await expect(tree.getByRole("treeitem", { name: /^README\.md/ })).toBeFocused()

    // Typing a name moves to it, wrapping past the end.
    await page.keyboard.type("pac")
    const pkg = tree.getByRole("treeitem", { name: /^package\.json/ })
    await expect(pkg).toBeFocused()
    await page.keyboard.press("ArrowUp")
    const publicFolder = tree.getByRole("treeitem", { name: /^public/ })
    await expect(publicFolder).toBeFocused()
    await page.keyboard.press("ArrowRight")
    await expect(publicFolder).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("ArrowRight")
    const logo = tree.getByRole("treeitem", { name: /^logo\.svg/ })
    await expect(logo).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(logo).toHaveAttribute("aria-selected", "true")
    await expect(pkg).toHaveAttribute("aria-selected", "false")

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Stack Trace folds library frames and opens a frame", async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto("/docs/ai/stack-trace")
    const preview = await mountPreview(page, "stack-trace-demo", "stack-trace")
    await expect(preview.getByRole("group", { name: "TypeError" })).toBeVisible()
    await expect(preview.locator('[data-slot="stack-trace-message"]')).toHaveText(
      "Cannot read properties of undefined (reading 'amount')"
    )
    const frames = preview.locator('[data-slot="stack-trace-frame"]')
    await expect(frames).toHaveCount(3)

    const library = preview.getByRole("button", { name: "3 library frames" })
    await expect(library).toHaveAttribute("aria-expanded", "false")
    await library.click()
    await expect(preview.getByRole("button", { name: "Hide 3 library frames" })).toHaveAttribute("aria-expanded", "true")
    await expect(frames).toHaveCount(6)
    await expect(preview.locator('[data-slot="stack-trace-frame"][data-library]')).toHaveCount(3)

    await preview.getByRole("button", { name: "Open /workspace/honest-app/lib/export.ts:14:32" }).click()
    await expect(preview.getByText("Opened lib/export.ts:14")).toBeVisible()

    await expectNoAxeViolations(page)
    expect(errors).toEqual([])
  })

  test("Stack Trace copies the original stack", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/docs/ai/stack-trace")
    const preview = await mountPreview(page, "stack-trace-demo", "stack-trace")
    await preview.getByRole("button", { name: "Copy stack trace" }).click()
    await expect(preview.getByRole("status")).toHaveText("Copied")
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text.startsWith("TypeError: Cannot read properties of undefined")).toBe(true)
    expect(text).toContain("node:internal/process/task_queues:105:5")
  })
})
