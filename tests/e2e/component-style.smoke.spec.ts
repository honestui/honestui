import { expect, test } from "@playwright/test"
import { parse, wcagContrast } from "culori"

type Page = import("@playwright/test").Page

const docsPage = "/docs/components/density"

function tokens(page: Page) {
  return page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement)
    return {
      radius: styles.getPropertyValue("--hui-radius-2").trim(),
      control: styles.getPropertyValue("--hui-font-size-control").trim(),
      accent: styles.getPropertyValue("--hui-accent-9").trim(),
    }
  })
}

function setRootAttribute(page: Page, name: string, value: string) {
  return page.evaluate(
    ([attribute, attributeValue]) =>
      document.documentElement.setAttribute(attribute, attributeValue),
    [name, value]
  )
}

test.describe("Component style", () => {
  test("one style applies without an attribute, and legacy data-style values change nothing", async ({ page }) => {
    await page.goto(docsPage)
    expect(await page.evaluate(() => document.documentElement.hasAttribute("data-style"))).toBe(false)

    const base = await tokens(page)
    expect(base.radius).toBe("10px")
    expect(base.control).toBe("14px")

    for (const legacy of ["modern", "traditional", "soft"]) {
      await setRootAttribute(page, "data-style", legacy)
      expect(await tokens(page), legacy).toEqual(base)
    }
  })

  test("a data-accent-color scope keeps its own accent", async ({ page }) => {
    await page.goto(docsPage)
    const base = await tokens(page)

    await setRootAttribute(page, "data-accent-color", "orange")
    const orange = await tokens(page)

    expect(orange.accent).not.toBe(base.accent)
  })
})

test.describe("Component style components", () => {
  test("consumer utilities override component style defaults", async ({ page }) => {
    await page.goto("/docs/components/card")
    const cards = page.locator('[data-component-preview="card-customization"]')
    await cards.scrollIntoViewIfNeeded()
    const card = cards.locator('[data-slot="card"]').first()
    await expect(card).toHaveCSS("border-top-left-radius", "0px")
    await expect(card).toHaveCSS("border-top-width", "0px")
    await expect(cards.locator('[data-variant="soft"]')).toHaveCSS("border-top-width", "0px")

    await page.goto("/docs/components/input-group")
    const preview = page.locator('[data-component-preview="input-group-search"]')
    await preview.scrollIntoViewIfNeeded()
    const input = preview.locator('[data-slot="input-control"]')
    const shadow = await input.evaluate((element) => getComputedStyle(element).boxShadow)
    const shadowColors = shadow.match(/(?:rgba?|oklch|oklab|lab|lch|color)\([^)]*\)/g) ?? []
    expect(shadow === "none" || (shadowColors.length > 0 && shadowColors.every((color) => parse(color)?.alpha === 0))).toBe(true)
  })

  for (const theme of ["light", "dark"]) {
    test(`unchecked choice boundaries meet contrast in ${theme}`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("theme", value), theme)
      for (const [component, role, label] of [
        ["checkbox", "checkbox", "Accept terms and conditions"],
        ["radio-group", "radio", "Vite"],
      ] as const) {
        await page.goto(`/docs/components/${component}`)
        const preview = page.locator(`[data-component-preview="${component}-demo"]`)
        await preview.scrollIntoViewIfNeeded()
        const control = preview.getByRole(role, { name: label })
        await expect(control).not.toBeChecked()
        await expect.poll(async () => control.evaluate((element) => {
          const styles = getComputedStyle(element)
          return [styles.borderTopColor, styles.backgroundColor]
        }).then(([border, background]) => wcagContrast(border, background))).toBeGreaterThanOrEqual(3)
        if (component === "checkbox") {
          const bounds = await control.evaluate((element) => ({
            radius: parseFloat(getComputedStyle(element).borderTopLeftRadius),
            width: element.getBoundingClientRect().width,
          }))
          expect(bounds.radius).toBeLessThan(bounds.width / 2)
        }
      }
    })
  }

  test("named control sizes align across density scopes", async ({ page }) => {
    await page.goto(docsPage)
    const preview = page.locator('[data-component-preview="control-size-comparison"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.locator('[data-control-size="sm"]')).toBeVisible()
    const selector = '[data-slot="button"], [data-slot="input-control"], input[data-slot="field-control"], [data-slot="select-trigger"], [data-slot="number-field-input"], [data-slot="toggle"]'

    for (const [density, heights] of [
      [null, [28, 36, 44]],
      ["compact", [24, 28, 36]],
      ["default", [28, 36, 44]],
      ["comfortable", [32, 40, 48]],
    ] as const) {
      await preview.evaluate((element, value) => {
        if (value) element.setAttribute("data-density", value)
        else element.removeAttribute("data-density")
      }, density)
      for (const [index, size] of ["sm", "default", "lg"].entries()) {
        const row = preview.locator(`[data-control-size="${size}"]`)
        for (const control of await row.locator(selector).all()) {
          expect(await control.evaluate((element) => element.getBoundingClientRect().height), `${density ?? "unscoped"}/${size}`).toBe(heights[index])
        }
      }
    }
  })

  test("Select inherits its Field label instead of a generic name", async ({ page }) => {
    await page.goto("/docs/components/field")
    const preview = page.locator('[data-component-preview="field-select"]')
    await preview.scrollIntoViewIfNeeded()
    const select = preview.getByRole("combobox", { name: "Country" })
    await expect(select).toHaveAccessibleDescription("This is an optional field")
    await select.focus()
    await page.keyboard.press("ArrowDown")
    await expect(page.getByRole("listbox")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(select).toBeFocused()
  })

  for (const [component, example, selector] of [
    ["field", "field-demo", 'input[data-slot="field-control"]'],
    ["number-field", "number-field-demo", '[data-slot="number-field-input"], [data-slot="number-field-increment"], [data-slot="number-field-decrement"]'],
    ["input-group", "input-group-search", '[data-slot="input-group"]'],
  ]) {
    test(`${component} follows form density`, async ({ page }) => {
      await page.goto(`/docs/components/${component}`)
      const preview = page.locator(`[data-component-preview="${example}"]`)
      await preview.scrollIntoViewIfNeeded()
      const controls = preview.locator(selector)
      await expect(controls.first()).toBeVisible()

      for (const [density, height] of [["compact", 28], ["default", 36], ["comfortable", 40]] as const) {
        await preview.evaluate((element, value) => element.setAttribute("data-density", value), density)
        for (const control of await controls.all()) {
          await expect(control).toHaveCSS("height", `${height}px`)
        }
      }
    })
  }

  test("input group buttons keep their embedded size", async ({ page }) => {
    await page.goto("/docs/components/input-group")
    const preview = page.locator('[data-component-preview="input-group-search"]')
    await preview.scrollIntoViewIfNeeded()
    await preview.locator("input").first().fill("query")
    const clear = preview.getByRole("button", { name: "Clear search" })
    await expect(clear).toHaveCSS("height", "24px")
  })

  test("composed inputs keep the invalid border", async ({ page }) => {
    await page.goto("/docs/components/autocomplete")
    const preview = page.locator('[data-component-preview="autocomplete-demo"]')
    await preview.scrollIntoViewIfNeeded()
    const input = preview.getByRole("combobox").first()
    const control = preview.locator('[data-slot="input-control"]').first()
    const danger = await control.evaluate((element) => {
      const probe = document.createElement("span")
      probe.style.borderColor = "var(--hui-color-border-danger-emphasis)"
      element.append(probe)
      const color = getComputedStyle(probe).borderTopColor
      probe.remove()
      return color
    })
    await input.evaluate((element) => element.setAttribute("aria-invalid", "true"))
    await expect(control).toHaveCSS("border-top-color", danger)
    // Hover must not replace the danger border with the hover hairline.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await control.hover()
    await expect(control).toHaveCSS("border-top-color", danger)
  })

  for (const [component, trigger, slot] of [
    ["dialog", "Open Dialog", "dialog"],
    ["sheet", "Open Sheet", "sheet"],
  ]) {
    test(`${component} keeps its close button, title and footer visible while content scrolls`, async ({ page }) => {
      await page.goto(`/docs/components/${component}`)
      const preview = page.locator(`[data-component-preview="${component}-demo"]`).first()
      await preview.scrollIntoViewIfNeeded()
      await preview.getByRole("button", { name: trigger }).click()
      const popup = page.locator(`[data-slot="${slot}-popup"]`)
      await expect(popup).toBeVisible()
      await page.setViewportSize({ width: 1000, height: 280 })
      // The popup re-centers with a transform transition after the resize.
      await popup.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)))
      const viewport = popup.locator(`[data-slot="${slot}-scroll-viewport"]`)
      const title = popup.locator(`[data-slot="${slot}-title"]`)
      const footer = popup.locator(`[data-slot="${slot}-footer"]`)
      for (const position of ["start", "end"]) {
        await viewport.evaluate((element, end) => { element.scrollTop = end ? element.scrollHeight : 0 }, position === "end")
        const [titleTop, footerBottom, height] = await page.evaluate(([titleSelector, footerSelector]) => [
          document.querySelector(titleSelector)!.getBoundingClientRect().top,
          document.querySelector(footerSelector)!.getBoundingClientRect().bottom,
          window.innerHeight,
        ], [`[data-slot="${slot}-popup"] [data-slot="${slot}-title"]`, `[data-slot="${slot}-popup"] [data-slot="${slot}-footer"]`])
        expect(titleTop, `${position} title`).toBeGreaterThanOrEqual(0)
        expect(footerBottom, `${position} footer`).toBeLessThanOrEqual(height)
      }
      await expect(title).toBeVisible()
      await expect(footer).toBeVisible()

      await viewport.evaluate((element) => { element.scrollTop = 0 })
      const fields = popup.locator("input")
      for (let index = 0; index < await fields.count(); index++) {
        // Focus must move to the field; re-focusing the active element does not scroll.
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
        await fields.nth(index).focus()
        const [field, headerBottom, footerTop] = await page.evaluate((prefix) => {
          const header = document.querySelector(`[data-slot="${prefix}-popup"] [data-slot="${prefix}-header"]`)!
          const footer = document.querySelector(`[data-slot="${prefix}-popup"] [data-slot="${prefix}-footer"]`)!
          const rect = document.activeElement!.getBoundingClientRect()
          return [[rect.top, rect.bottom], header.getBoundingClientRect().bottom, footer.getBoundingClientRect().top]
        }, slot)
        expect(field[0], `field ${index} below header`).toBeGreaterThanOrEqual(headerBottom - 0.5)
        expect(field[1], `field ${index} above footer`).toBeLessThanOrEqual(footerTop + 0.5)
      }
      const close = popup.getByRole("button", { name: "Close" })
      const top = await close.evaluate((element) => element.getBoundingClientRect().top)
      expect(top).toBeGreaterThanOrEqual(0)
      await close.click()
      await expect(popup).toBeHidden()
    })
  }

  test("autocomplete popups share the portal layer with sheets", async ({ page }) => {
    await page.goto("/docs/components/autocomplete")
    const preview = page.locator('[data-component-preview="autocomplete-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await preview.getByRole("combobox").first().fill("a")
    const positioner = page.locator('[data-slot="autocomplete-positioner"]')
    await expect(positioner).toBeVisible()
    const portal = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--hui-z-index-portal").trim()
    )
    await expect(positioner).toHaveCSS("z-index", portal)
  })

  test("a focused textarea keeps its whole focus ring clear of the pinned header", async ({ page }) => {
    await page.goto("/docs/components/dialog")
    const preview = page.locator('[data-component-preview="dialog-close-confirmation"]')
    await preview.scrollIntoViewIfNeeded()
    await preview.getByRole("button", { name: "Compose" }).click()
    const popup = page.locator('[data-slot="dialog-popup"]')
    await expect(popup).toBeVisible()
    await page.setViewportSize({ width: 1000, height: 260 })
    await popup.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)))
    // Reach the textarea backwards from the footer, which leaves the viewport
    // scrolled to the end with the textarea partly under the header.
    await popup.getByRole("button", { name: "Cancel" }).focus()
    await page.keyboard.press("Shift+Tab")
    await expect(popup.locator("textarea")).toBeFocused()
    const [top, headerBottom] = await page.evaluate(() => [
      document.querySelector('[data-slot="dialog-popup"] textarea')!.getBoundingClientRect().top,
      document.querySelector('[data-slot="dialog-popup"] [data-slot="dialog-header"]')!.getBoundingClientRect().bottom,
    ])
    // The ring draws 1px outside the textarea.
    expect(top - 1).toBeGreaterThanOrEqual(headerBottom)
  })

  test("pointer focus in a partly hidden field neither scrolls nor breaks selection", async ({ page }) => {
    await page.goto("/docs/components/dialog")
    const preview = page.locator('[data-component-preview="dialog-close-confirmation"]')
    await preview.scrollIntoViewIfNeeded()
    await preview.getByRole("button", { name: "Compose" }).click()
    const popup = page.locator('[data-slot="dialog-popup"]')
    await expect(popup).toBeVisible()
    const textarea = popup.locator("textarea")
    await textarea.fill("Selectable draft")
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.setViewportSize({ width: 1000, height: 260 })
    await popup.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)))
    const viewport = popup.locator('[data-slot="dialog-scroll-viewport"]')
    const scrollTop = await viewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight
      return element.scrollTop
    })
    const [headerBottom, footerTop, box] = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(`[data-slot="dialog-popup"] ${selector}`)!.getBoundingClientRect()
      const area = rect("textarea")
      return [rect('[data-slot="dialog-header"]').bottom, rect('[data-slot="dialog-footer"]').top, { left: area.left, right: area.right }]
    })
    // The textarea's top edge sits under the header; drag across its visible strip.
    const y = Math.min(headerBottom + 10, footerTop - 4)
    await page.mouse.move(box.left + 4, y)
    await page.mouse.down()
    await page.mouse.move(box.right - 4, y, { steps: 5 })
    await page.mouse.up()
    await expect(textarea).toBeFocused()
    expect(await viewport.evaluate((element) => element.scrollTop)).toBe(scrollTop)
    const [start, end] = await textarea.evaluate((element: HTMLTextAreaElement) => [element.selectionStart, element.selectionEnd])
    expect(end).toBeGreaterThan(start)
  })

  test("a pointer press that never reports its release does not disable keyboard reveal", async ({ page }) => {
    await page.goto("/docs/components/dialog")
    const preview = page.locator('[data-component-preview="dialog-close-confirmation"]')
    await preview.scrollIntoViewIfNeeded()
    await preview.getByRole("button", { name: "Compose" }).click()
    const popup = page.locator('[data-slot="dialog-popup"]')
    await expect(popup).toBeVisible()
    await page.setViewportSize({ width: 1000, height: 260 })
    await popup.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)))
    // A press whose release is lost, for example when the window loses focus mid-click.
    await popup.locator('[data-slot="dialog-scroll-viewport"]').dispatchEvent("pointerdown")
    await popup.getByRole("button", { name: "Cancel" }).focus()
    await page.keyboard.press("Shift+Tab")
    await expect(popup.locator("textarea")).toBeFocused()
    const [top, headerBottom] = await page.evaluate(() => [
      document.querySelector('[data-slot="dialog-popup"] textarea')!.getBoundingClientRect().top,
      document.querySelector('[data-slot="dialog-popup"] [data-slot="dialog-header"]')!.getBoundingClientRect().bottom,
    ])
    expect(top - 1).toBeGreaterThanOrEqual(headerBottom)
  })

  test("a nested dialog dims the whole parent, including its pinned header and footer", async ({ page }) => {
    await page.goto("/docs/components/dialog")
    const preview = page.locator('[data-component-preview="dialog-nested"]')
    await preview.scrollIntoViewIfNeeded()
    await preview.getByRole("button", { name: "Open parent" }).click()
    const parent = page.locator('[data-slot="dialog-popup"]').first()
    await expect(parent).toBeVisible()
    await parent.getByRole("button", { name: "Edit details" }).click()
    await expect(parent).toHaveAttribute("data-nested-dialog-open", "")
    const layer = await parent.evaluate((element) => getComputedStyle(element, "::after").zIndex)
    expect(Number(layer)).toBeGreaterThan(2)
  })

  test("button press feedback respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/docs/components/button")
    const preview = page.locator('[data-component-preview="button-demo"]')
    const button = preview.getByRole("button").first()
    await button.scrollIntoViewIfNeeded()
    await button.hover()
    await page.mouse.down()
    try {
      await expect(button).toHaveCSS("scale", "none")
    } finally {
      await page.mouse.up()
    }
  })

  test("controls grow to 36px and an explicit density still wins", async ({ page }) => {
    await page.goto("/docs/components/density")
    const preview = page.locator('[data-component-preview="density-demo"]')
    await preview.scrollIntoViewIfNeeded()
    const scope = preview.getByTestId("density-demo-table-scope")
    await expect(scope.getByRole("button", { name: "Export" })).toHaveCSS("min-height", "28px")

    const height = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--hui-density-control-height").trim()
    )
    expect(height).toBe("36px")
  })

  test("ghost buttons have no resting border", async ({ page }) => {
    await page.goto("/docs/components/button")
    const preview = page.locator('[data-component-preview="button-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.getByRole("button", { name: "Cancel" })).toHaveCSS(
      "border-top-color",
      "rgba(0, 0, 0, 0)"
    )
  })

  test("fields pair a pale hairline with a faint shadow", async ({ page }) => {
    await page.goto("/docs/components/input")
    const preview = page.locator('[data-component-preview="input-demo"]')
    await preview.scrollIntoViewIfNeeded()
    const shadow = await preview
      .locator('[data-slot="input-control"]')
      .evaluate((element) => getComputedStyle(element).boxShadow)
    expect(shadow).not.toBe("none")
  })

  test("only numeric table cells use tabular figures", async ({ page }) => {
    await page.goto("/docs/components/table")
    const preview = page.locator('[data-component-preview="table-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.locator("table")).toHaveCSS("font-variant-numeric", "normal")
    await expect(preview.getByRole("cell", { name: "$12,500" })).toHaveCSS(
      "font-variant-numeric",
      "tabular-nums"
    )
  })

  test("constrained table cells keep long values readable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto("/docs/components/table")
    const preview = page.locator('[data-component-preview="table-demo"]')
    await preview.scrollIntoViewIfNeeded()
    const table = preview.locator("table")
    await table.evaluate((element) => {
      element.style.tableLayout = "fixed"
      element.style.width = "320px"
    })
    const cell = table.locator('tbody [data-slot="table-cell"]').first()
    await cell.evaluate((element) => {
      element.textContent = "A customer supplied reference with a very long value: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    })
    const dimensions = await cell.evaluate((element) => ({
      contentWidth: element.scrollWidth,
      width: element.clientWidth,
      contentHeight: element.scrollHeight,
      height: element.clientHeight,
    }))
    expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width)
    expect(dimensions.contentHeight).toBeLessThanOrEqual(dimensions.height)
    await expect(cell).toHaveCSS("white-space", "normal")
  })

  test("cards use the large card radius", async ({ page }) => {
    await page.goto("/docs/components/card")
    const card = page.locator('[data-slot="card"]').first()
    await expect(card).toHaveCSS("border-top-left-radius", "20px")
  })

  test("frame corners stay concentric with their panels", async ({ page }) => {
    await page.goto("/docs/components/frame")
    const preview = page.locator('[data-component-preview="frame-demo"]')
    await preview.scrollIntoViewIfNeeded()
    await expect(preview.locator('[data-slot="frame"]')).toHaveCSS("border-top-left-radius", "20px")
    await expect(preview.locator('[data-slot="frame"]')).toHaveCSS("padding-top", "8px")
    await expect(preview.locator('[data-slot="frame-panel"]')).toHaveCSS("border-top-left-radius", "12px")
  })
})
