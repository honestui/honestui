import { test, expect } from "@playwright/test"
import { syntaxTailwind } from "../../../registry/honest-ai/lib/prose-syntax-tailwind"
import AxeBuilder from "@axe-core/playwright"

test("syntax playground highlights, follows the site theme, switches language, and copies", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/docs/ai/prose-syntax")
  const playground = page.getByRole("region", { name: "Syntax playground" })
  const code = playground.locator("pre")
  await expect(code.locator(".prose-syntax-keyword").first()).toBeVisible({ timeout: 15000 })
  const source = await code.textContent()
  const light = await code.locator(".prose-syntax-keyword").first().evaluate(element => getComputedStyle(element).color)
  // The playground follows the site theme, as a real app would.
  await page.evaluate(() => { document.documentElement.classList.remove("light"); document.documentElement.classList.add("dark"); document.documentElement.dataset.theme = "dark" })
  expect(await code.textContent()).toBe(source)
  const dark = await code.locator(".prose-syntax-keyword").first().evaluate(element => getComputedStyle(element).color)
  expect(dark).not.toBe(light)
  await playground.getByRole("tab", { name: "Python" }).click()
  await expect(code).toHaveAttribute("aria-label", "Python example")
  await expect(code.locator(".prose-syntax-keyword").first()).toBeVisible({ timeout: 15000 })
  await playground.getByRole("button", { name: "Copy code" }).click()
  await expect(playground.getByRole("status")).toHaveText("Copied")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await code.textContent())
  await code.focus()
  await expect(code).toBeFocused()
  await page.setViewportSize({ width: 320, height: 800 })
  expect(await playground.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  const results = await new AxeBuilder({ page }).include('[aria-label="Syntax playground"]').analyze()
  expect(results.violations).toEqual([])
  await page.emulateMedia({ forcedColors: "active" })
  await expect(code).toBeVisible()
})

test("registry includes worker, role contract, and theme dependencies", async ({ request }) => {
  const visited = new Set<string>()
  async function visit(name: string) {
    if (visited.has(name)) return
    visited.add(name)
    const response = await request.get(`/r/ai/${name}.json`)
    expect(response.ok()).toBe(true)
    const item = await response.json()
    for (const dependency of item.registryDependencies ?? []) {
      const match = /\/r\/ai\/([^/]+)\.json$/.exec(dependency)
      if (match && match[1].startsWith("prose-syntax")) await visit(match[1])
    }
  }
  await visit("prose-syntax-react")
  expect([...visited]).toEqual(expect.arrayContaining(["prose-syntax-react", "prose-syntax-client", "prose-syntax-worker", "prose-syntax", "prose-syntax-shared", "prose-syntax-theme"]))
})

test("Tailwind syntax utilities work without the stylesheet class", async ({ page }) => {
  await page.goto("/docs/ai/prose-syntax")
  const code = page.getByRole("region", { name: "Syntax playground" }).locator("pre")
  await expect(code.locator(".prose-syntax-keyword").first()).toBeVisible()
  const before = await code.locator(".prose-syntax-keyword").first().evaluate(element => getComputedStyle(element).color)
  await code.evaluate((element, classes) => { element.classList.remove("honest-syntax"); element.classList.add(...classes.split(" ")) }, syntaxTailwind)
  expect(await code.locator(".prose-syntax-keyword").first().evaluate(element => getComputedStyle(element).color)).toBe(before)
  await code.evaluate(element => element.setAttribute("data-syntax-theme", "dark"))
  expect(await code.evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(17, 17, 17)")
  await page.evaluate(() => document.documentElement.classList.add("dark"))
  await code.evaluate(element => element.setAttribute("data-syntax-theme", "light"))
  expect(await code.evaluate(element => getComputedStyle(element).backgroundColor)).toBe("rgb(252, 252, 252)")
})

test("palettes preserve source and meet contrast in CSS and Tailwind, light and dark", async ({ page }) => {
  await page.goto("/docs/ai/prose-syntax")
  const playground = page.getByRole("region", { name: "Syntax playground" })
  const code = playground.locator("pre")
  await expect(code.locator(".prose-syntax-keyword").first()).toBeVisible()
  const source = await code.textContent()
  const colors = new Set<string>()
  for (const palette of ["Violet", "Graphite"]) {
    await playground.getByRole("combobox", { name: "Palette", exact: true }).click()
    await page.getByRole("option", { name: palette, exact: true }).click()
    await expect(code).toHaveAttribute("data-syntax-palette", palette.toLowerCase())
    expect(await code.textContent()).toBe(source)
    colors.add(await code.locator(".prose-syntax-keyword").first().evaluate(element => getComputedStyle(element).color))
  }
  expect(colors.size).toBe(2)
  const inspect = () => code.evaluate(element => {
    const luminance = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
    const styles = getComputedStyle(element)
    const marker = document.createElement("span")
    marker.setAttribute("data-highlighted-line", "")
    element.append(marker)
    const surfaces = [styles.backgroundColor, getComputedStyle(marker).backgroundColor]
    marker.remove()
    return ["plain", "comment", "keyword", "string", "constant", "function", "type", "property", "tag", "punctuation"].map(role => {
      const token = document.createElement("span")
      token.className = `prose-syntax-${role}`
      element.append(token)
      const color = getComputedStyle(token).color
      token.remove()
      return { role, color, ratios: surfaces.map(background => {
        const a = luminance(color), b = luminance(background)
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
      }) }
    })
  })
  const expected = new Map<string, Awaited<ReturnType<typeof inspect>>>()
  for (const mode of ["css", "tailwind"]) {
    if (mode === "tailwind") await code.evaluate((element, classes) => { element.classList.remove("honest-syntax"); element.classList.add(...classes.split(" ")) }, syntaxTailwind)
    for (const palette of ["violet", "graphite"]) {
      for (const theme of ["light", "dark"]) {
        await code.evaluate((element, settings) => { element.setAttribute("data-syntax-palette", settings.palette); element.setAttribute("data-syntax-theme", settings.theme) }, { palette, theme })
        const actual = await inspect()
        for (const { role, ratios } of actual) for (const ratio of ratios) expect(ratio, `${mode}/${palette}/${theme}/${role}`).toBeGreaterThanOrEqual(4.5)
        const key = `${palette}/${theme}`
        if (mode === "css") expected.set(key, actual)
        else expect(actual).toEqual(expected.get(key))
      }
    }
  }
  expect(await code.textContent()).toBe(source)
})

test("CodeMirror editor uses Honest colors, re-highlights mid-file edits, and follows the site theme", async ({ page }) => {
  await page.goto("/docs/ai/prose-syntax")
  // Docs previews mount when they scroll into view.
  await page.getByRole("heading", { name: "Editors" }).scrollIntoViewIfNeeded()
  const example = page.getByRole("region", { name: "Editor example" })
  const editor = example.locator(".cm-editor")
  await expect(editor).toHaveClass(/honest-syntax/)
  await expect(editor.locator(".prose-syntax-keyword").first()).toBeVisible()
  const line = (text: string) => editor.locator(".cm-line", { hasText: text })
  // Reads the innermost element, which is what paints the text when spans nest.
  const style = (locator: ReturnType<typeof line>) => locator.evaluate(element => {
    let inner: Element = element
    while (inner.firstElementChild) inner = inner.firstElementChild
    return { color: getComputedStyle(inner).color, fontStyle: getComputedStyle(inner).fontStyle }
  })
  const roleStyle = (role: string) => editor.evaluate((element, role) => {
    const token = document.createElement("span")
    token.className = `prose-syntax-${role}`
    element.querySelector(".cm-content")!.append(token)
    const computed = getComputedStyle(token)
    const result = { color: computed.color, fontStyle: computed.fontStyle }
    token.remove()
    return result
  }, role)

  // Parameters come from semantic tokens and win over the grammar's variable color.
  const minimumUse = line(">= minimum").locator(".prose-syntax-parameter", { hasText: "minimum" })
  await expect(minimumUse).toBeVisible()
  expect(await style(minimumUse)).toEqual(await roleStyle("parameter"))
  expect((await roleStyle("parameter")).fontStyle).toBe("italic")
  // The slant must render even when the code font has no italic face.
  expect(await minimumUse.evaluate(element => getComputedStyle(element).fontSynthesisStyle)).toBe("auto")
  expect((await roleStyle("parameter")).color).not.toBe((await roleStyle("variable")).color)

  // A mid-file edit is highlighted, not left as plain text.
  await line("export function").click()
  await page.keyboard.press("End")
  await page.keyboard.type("\nconst limit = 10 + 2")
  await expect(line("const limit").locator(".prose-syntax-keyword")).toHaveText("const")
  await expect(line("const limit").locator(".prose-syntax-constant").first()).toHaveText("10")
  await expect(line("const limit").locator(".prose-syntax-operator").first()).toBeVisible()

  // A lint warning is underlined in the theme's color, with a message.
  await page.keyboard.type("\nif (limit == minimum) {}")
  const warning = editor.locator(".cm-lintRange-warning")
  await expect(warning).toHaveText("==")
  expect(await warning.evaluate(element => getComputedStyle(element).textDecorationStyle)).toBe("wavy")
  expect(await warning.evaluate(element => getComputedStyle(element).textDecorationColor)).toBe((await roleStyle("constant")).color)

  // Code the grammar cannot parse is marked invalid.
  await page.keyboard.type("\nconst = ;")
  await expect(editor.locator(".prose-syntax-invalid").first()).toBeVisible()

  // Editor roles meet 4.5:1 on the editor surface in both site themes.
  const contrast = () => editor.evaluate(element => {
    const luminance = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0)
    const background = getComputedStyle(element).backgroundColor
    return ["plain", "keyword", "variable", "parameter", "operator", "invalid", "comment"].map(role => {
      const token = document.createElement("span")
      token.className = `prose-syntax-${role}`
      element.querySelector(".cm-content")!.append(token)
      const a = luminance(getComputedStyle(token).color), b = luminance(background)
      token.remove()
      return { role, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }
    })
  })
  for (const { role, ratio } of await contrast()) expect(ratio, `light ${role}`).toBeGreaterThanOrEqual(4.5)
  const light = (await roleStyle("keyword")).color
  await page.evaluate(() => { document.documentElement.classList.remove("light"); document.documentElement.classList.add("dark"); document.documentElement.dataset.theme = "dark" })
  expect((await roleStyle("keyword")).color).not.toBe(light)
  for (const { role, ratio } of await contrast()) expect(ratio, `dark ${role}`).toBeGreaterThanOrEqual(4.5)

  // Selection is drawn, and the editor passes axe.
  await editor.locator(".cm-content").focus()
  await page.keyboard.press("ControlOrMeta+a")
  await expect(editor.locator(".cm-selectionBackground").first()).toBeVisible()
  const results = await new AxeBuilder({ page }).include('[aria-label="Editor example"]').analyze()
  expect(results.violations).toEqual([])
})

test("CodeMirror editor highlights every demo language and keeps edits per tab", async ({ page }) => {
  await page.goto("/docs/ai/prose-syntax")
  await page.getByRole("heading", { name: "Editors" }).scrollIntoViewIfNeeded()
  const example = page.getByRole("region", { name: "Editor example" })
  const editor = example.locator(".cm-editor")
  await expect(editor.locator(".prose-syntax-keyword").first()).toBeVisible()
  const expected: Record<string, string> = { Python: "keyword", HTML: "tag", CSS: "type", JSON: "property", SQL: "keyword", Markdown: "keyword", TypeScript: "keyword" }
  await editor.locator(".cm-line").first().click()
  await page.keyboard.press("End")
  await page.keyboard.type(" (edited)")
  for (const [label, role] of Object.entries(expected)) {
    await example.getByRole("tab", { name: label }).click()
    await expect(example.getByRole("tab", { name: label })).toHaveAttribute("aria-selected", "true")
    await expect(editor.locator(`.prose-syntax-${role}`).first(), label).toBeVisible()
    await expect(editor.locator(".cm-content")).toHaveAttribute("aria-label", new RegExp(`${label} editor$`))
  }
  await expect(editor.locator(".cm-line").first()).toContainText("(edited)")
})
