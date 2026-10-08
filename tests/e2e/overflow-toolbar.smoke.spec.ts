import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/overflow-toolbar"

/**
 * Previews lazy-mount while scrolled near the viewport, so drive wheel
 * events until the preview's landmark control exists.
 */
async function mountPreview(page: Page, control: Locator) {
  await page.mouse.move(700, 400)

  for (let i = 0; i < 120; i += 1) {
    if ((await control.count()) === 1) {
      await control.scrollIntoViewIfNeeded()
      return
    }

    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }

  throw new Error("the preview did not mount")
}

/** The names of the toolbar's buttons, in order. */
function buttonNames(toolbar: Locator) {
  return toolbar
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label") ?? button.textContent ?? "")
    )
}

async function expectNoOverflow(toolbar: Locator) {
  await expect
    .poll(() => toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth))
    .toBe(true)
}

async function setSlider(page: Page, slider: Locator, value: number) {
  await slider.focus()
  await page.keyboard.press("End")

  for (let step = 0; step < 100; step += 1) {
    if (Number(await slider.getAttribute("aria-valuenow")) <= value) return
    await page.keyboard.press("ArrowLeft")
  }

  throw new Error(`the slider did not reach ${value}`)
}

test.describe("Overflow Toolbar docs previews", () => {
  test("a panel that takes the toolbar's space collapses actions and moves focus with them", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Document" })
    await mountPreview(page, toolbar)

    await expect(toolbar.getByRole("button", { name: "More" })).toHaveCount(0)
    const viewport = page.viewportSize()

    await toolbar.getByRole("button", { name: "Show comments" }).focus()
    await page.keyboard.press("Enter")

    // The window did not change; the panel beside the toolbar took the space.
    await expect(page.getByRole("region", { name: "Comments" })).toBeVisible()
    expect(page.viewportSize()).toEqual(viewport)

    const more = toolbar.getByRole("button", { name: "More" })
    await expect(toolbar.getByRole("button", { name: /comments/ })).toHaveCount(0)
    await expect(more).toBeFocused()
    await expectNoOverflow(toolbar)

    // Pinned and higher-priority actions are still in the toolbar.
    await expect(toolbar.getByRole("button", { name: "Undo" })).toBeVisible()
    await expect(toolbar.getByRole("button", { name: "Copy link" })).toBeVisible()

    await page.keyboard.press("ArrowDown")
    const menu = page.getByRole("menu")
    await expect(menu.getByRole("group", { name: "Review" })).toContainText("Hide comments")
    await menu.getByRole("menuitem", { name: "Hide comments" }).click()

    await expect(page.getByRole("region", { name: "Comments" })).toHaveCount(0)
    await expect(page.getByText("Last action: Hide comments")).toBeVisible()
    await expect(more).toHaveCount(0)
    // More is gone, so focus goes to the action that came back last.
    await expect(toolbar.getByRole("button", { name: "Show comments" })).toBeFocused()
  })

  test("actions collapse lowest priority first and the pinned action stays", async ({ page }) => {
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Report" })
    await mountPreview(page, toolbar)
    const slider = page.getByRole("slider")

    await expect.poll(() => buttonNames(toolbar)).toEqual([
      "Save",
      "Share",
      "Export",
      "Duplicate",
      "Archive",
      "Delete",
    ])

    const collapseOrder = ["Delete", "Archive", "Duplicate", "Export", "Share"]
    let previousVisible = 6

    for (const width of [400, 330, 250, 200, 160]) {
      await setSlider(page, slider, width)
      await expectNoOverflow(toolbar)

      const names = await buttonNames(toolbar)
      const actions = names.filter((name) => name !== "More")
      const collapsed = collapseOrder.slice(0, 6 - actions.length)

      // Whatever is missing is exactly the lowest-priority end of the order.
      expect(actions).toEqual(["Save", ...collapseOrder.slice(collapsed.length).reverse()])
      expect(names.includes("More")).toBe(collapsed.length > 0)
      expect(actions.length).toBeLessThanOrEqual(previousVisible)
      previousVisible = actions.length
    }

    expect(await buttonNames(toolbar)).toEqual(["Save", "More"])

    await setSlider(page, slider, 640)
    await expect.poll(() => buttonNames(toolbar)).toHaveLength(6)
  })

  test("the menu keeps groups, order, and the disabled state", async ({ page }) => {
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Report" })
    await mountPreview(page, toolbar)

    // Disabled in the toolbar, and still focusable there.
    const archive = toolbar.getByRole("button", { name: "Archive" })
    await expect(archive).toHaveAttribute("aria-disabled", "true")
    await archive.focus()
    await expect(archive).toBeFocused()

    await setSlider(page, page.getByRole("slider"), 160)
    await toolbar.getByRole("button", { name: "More" }).click()
    const menu = page.getByRole("menu")

    await expect(menu.getByRole("group", { name: "Distribute" }).getByRole("menuitem")).toHaveText([
      "Share",
      "Export",
    ])
    await expect(menu.getByRole("group", { name: "Manage" }).getByRole("menuitem")).toHaveText([
      "Duplicate",
      "Archive",
      "Delete",
    ])
    await expect(menu.getByRole("menuitem", { name: "Archive" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    // A collapsed action is in the menu only, not hidden in the toolbar as well.
    await expect(toolbar.getByRole("group", { name: "Manage" })).toHaveCount(0)
  })

  test("arrow keys reach More, stay inside the open menu, and Escape returns focus", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Report" })
    await mountPreview(page, toolbar)
    await setSlider(page, page.getByRole("slider"), 250)

    const more = toolbar.getByRole("button", { name: "More" })
    await toolbar.getByRole("button", { name: "Save" }).focus()
    await page.keyboard.press("ArrowLeft")
    await expect(more).toBeFocused()

    await page.keyboard.press("Enter")
    const menu = page.getByRole("menu")
    await expect(menu.getByRole("menuitem").first()).toBeFocused()

    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowLeft")
    await expect(menu.getByRole("menuitem").first()).toBeFocused()

    await page.keyboard.press("Escape")
    await expect(menu).toHaveCount(0)
    await expect(more).toBeFocused()
  })

  test("other toolbar parts keep their width while icon-only actions collapse", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Files" })
    await mountPreview(page, toolbar)
    const field = toolbar.getByRole("searchbox", { name: "Filter files" })
    const fieldWidth = await field.evaluate((element) => element.getBoundingClientRect().width)

    await expect(toolbar.getByRole("button")).toHaveCount(4)

    await page.getByRole("switch", { name: "Narrow container" }).click()

    const more = toolbar.getByRole("button", { name: "More file actions" })
    await expect(more).toBeVisible()
    await expectNoOverflow(toolbar)
    await expect(toolbar.getByRole("button", { name: "Download" })).toBeVisible()
    await expect(toolbar.getByRole("button", { name: "Move to trash" })).toHaveCount(0)
    expect(await field.evaluate((element) => element.getBoundingClientRect().width)).toBe(
      fieldWidth
    )

    await more.click()
    await expect(page.getByRole("menuitem", { name: "Move to trash" })).toBeVisible()
  })

  test("toolbars and the open menu have no detectable accessibility violations", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Report" })
    await mountPreview(page, toolbar)
    await setSlider(page, page.getByRole("slider"), 250)
    await toolbar.getByRole("button", { name: "More" }).click()
    await expect(page.getByRole("menu")).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[data-slot="overflow-toolbar"]')
      .include('[data-slot="menu-popup"]')
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("at phone width the toolbar collapses on load without scrolling the page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(docsPage)
    const toolbar = page.getByRole("toolbar", { name: "Document" })
    await mountPreview(page, toolbar)

    await expect(toolbar.getByRole("button", { name: "More" })).toBeVisible()
    await expect(toolbar.getByRole("button", { name: "Undo" })).toBeVisible()
    await expectNoOverflow(toolbar)

    const pageOverflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(pageOverflows).toBe(false)
  })
})
