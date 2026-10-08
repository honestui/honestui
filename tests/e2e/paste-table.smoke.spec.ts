import { expect, test, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/paste-table"

const contacts = [
  "Full name\tE-mail\tSeats\tStart date",
  "Ana Ruiz\tana@northwind.example\t12\t3/4/2026",
  "Li Wei\tli.wei@northwind\t1,250\t03/18/2026",
  "Sam Cole\tsam@northwind.example\tfive\t2026-04-01",
  "Dee Park\tdee@northwind.example\t3\t4/31/2026",
].join("\r\n")

const prices = [
  "Artikelnummer\tPreis\tGültig ab\tGültig bis\tStatus\tNotiz",
  "KB-1042\t1.249,90\t01.03.2026\t31.03.2026\tAktiv\tFrühjahr",
  "KB-1043\t89,5\t15.03.2026\t01.03.2026\tPausiert\t",
].join("\n")

/**
 * Previews lazy-mount while scrolled near the viewport, so drive wheel
 * events until the importer with this accessible name exists.
 */
async function mountImporter(page: Page, name: string) {
  const importer = page.getByRole("region", { name })

  await page.mouse.move(700, 400)

  for (let i = 0; i < 120; i += 1) {
    if ((await importer.count()) === 1) {
      await importer.scrollIntoViewIfNeeded()
      return importer
    }

    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }

  throw new Error(`no importer named "${name}" mounted`)
}

/** Fires the paste event a browser sends for Ctrl+V, carrying spreadsheet text. */
async function paste(importer: Locator, text: string) {
  const field = importer.getByRole("textbox", { name: "Paste rows from a spreadsheet" })
  await field.focus()
  await field.evaluate((element, value) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData("text/plain", value)
    element.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }))
  }, text)
}

function summary(importer: Locator) {
  return importer.locator('[data-slot="paste-table-summary"]')
}

test.describe("Paste Table docs previews", () => {
  test("one paste becomes a mapped, parsed preview with each problem explained", async ({ page }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import contacts")

    await paste(importer, contacts)

    await expect(summary(importer)).toHaveText("4 rows. 3 cells in 3 rows need fixing.")
    await expect(summary(importer)).toBeFocused()
    await expect(importer.getByRole("switch", { name: "First row is a header" })).toBeChecked()

    for (const [column, field] of [
      ["Full name", "Name"],
      ["E-mail", "Email"],
      ["Seats", "Seats"],
      ["Start date", "Start date"],
    ]) {
      await expect(importer.getByRole("combobox", { name: `Field for ${column}` })).toHaveText(field)
    }

    // Valid cells show the value that will be imported, not the text that was pasted.
    await expect(importer.getByRole("button", { name: "Edit Start date in row 1: 2026-03-04" })).toBeVisible()
    await expect(importer.getByRole("button", { name: "Edit Seats in row 2: 1250" })).toBeVisible()

    await expect(importer.locator('[data-slot="paste-table-cell-error"]')).toHaveText([
      "Enter an email address, such as name@example.com",
      "Enter a number, such as 1,234.5",
      "Enter a date as MM/DD/YYYY",
    ])
    await expect(
      importer.getByRole("button", { name: "Edit Seats in row 3: five" })
    ).toHaveAccessibleDescription("Enter a number, such as 1,234.5")
  })

  test("cells are fixed by keyboard and the import sends typed rows", async ({ page }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import contacts")
    await paste(importer, contacts)

    // Import refuses while cells are invalid, says why, and lands on the first problem.
    await importer.getByRole("button", { name: "Import 4 rows" }).click()
    await expect(importer.getByRole("alert")).toHaveText(
      "Fix or remove the rows with problems before importing."
    )
    const email = importer.getByRole("button", { name: "Edit Email in row 2: li.wei@northwind" })
    await expect(email).toBeFocused()

    await page.keyboard.press("Enter")
    const emailInput = importer.getByRole("textbox", { name: "Email, row 2" })
    await expect(emailInput).toBeFocused()
    await emailInput.fill("li.wei@northwind.example")
    await page.keyboard.press("Enter")

    await expect(summary(importer)).toHaveText("4 rows. 2 cells in 2 rows need fixing.")
    await expect(
      importer.getByRole("button", { name: "Edit Email in row 2: li.wei@northwind.example" })
    ).toBeFocused()
    await expect(importer.getByRole("alert")).toHaveCount(0)

    // Escape leaves the pasted text as it was.
    await importer.getByRole("button", { name: "Next problem" }).click()
    const seats = importer.getByRole("button", { name: "Edit Seats in row 3: five" })
    await expect(seats).toBeFocused()
    await page.keyboard.press("Enter")
    await importer.getByRole("textbox", { name: "Seats, row 3" }).fill("5")
    await page.keyboard.press("Escape")
    await expect(seats).toBeFocused()

    await seats.click()
    await importer.getByRole("textbox", { name: "Seats, row 3" }).fill("5")
    await page.keyboard.press("Tab")
    await expect(summary(importer)).toHaveText("4 rows. 1 cell in 1 row needs fixing.")

    await importer.getByRole("button", { name: "Remove 1 row with problems" }).click()
    await expect(summary(importer)).toHaveText("3 rows ready to import.")

    await importer.getByRole("button", { name: "Import 3 rows" }).click()

    await expect(importer.locator('[data-slot="paste-table-result"]')).toHaveText("3 rows imported.")
    await expect(importer.getByRole("textbox", { name: "Paste rows from a spreadsheet" })).toBeFocused()
    await expect(page.getByText(/^Last import:/)).toHaveText(
      "Last import: Ana Ruiz (2026-03-04), Li Wei (2026-03-18), Sam Cole (2026-04-01)."
    )
  })

  test("columns can be remapped, skipped, and are required when the field is", async ({ page }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import price list")
    await paste(importer, prices)

    await expect(importer.getByRole("combobox", { name: "Field for Notiz" })).toHaveText("Do not import")
    await expect(importer.getByRole("button", { name: "Edit Price in row 1: 1249.9" })).toBeVisible()
    await expect(importer.getByRole("button", { name: "Edit Valid from in row 2: 2026-03-15" })).toBeVisible()
    await expect(importer.locator('[data-slot="paste-table-cell-error"]')).toHaveText([
      "Choose a date on or after Valid from",
    ])

    const sku = importer.getByRole("combobox", { name: "Field for Artikelnummer" })
    await sku.click()
    await page.getByRole("option", { name: "Do not import" }).click()
    await expect(importer.getByRole("alert")).toHaveText(
      "No column is mapped to SKU. Choose SKU for one of the columns."
    )

    // Choosing a field that another column holds moves it.
    await importer.getByRole("combobox", { name: "Field for Notiz" }).click()
    await page.getByRole("option", { name: "Status" }).click()
    await expect(importer.getByRole("combobox", { name: "Field for Status" })).toHaveText("Do not import")

    await sku.click()
    await page.getByRole("option", { name: "SKU" }).click()
    await expect(importer.getByRole("alert")).toHaveCount(0)
  })

  test("typed text is read with the button, and the header switch reclassifies the first row", async ({
    page,
  }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import discount codes")

    await importer.getByRole("textbox", { name: "Paste rows from a spreadsheet" }).fill("SPRING\t15\nLOYAL\t20")
    await importer.getByRole("button", { name: "Preview rows" }).click()

    await expect(summary(importer)).toHaveText("2 rows ready to import.")
    const header = importer.getByRole("switch", { name: "First row is a header" })
    await expect(header).not.toBeChecked()
    await expect(importer.getByRole("combobox", { name: "Field for Column 1" })).toHaveText("Code")

    await header.focus()
    await page.keyboard.press("Space")
    await expect(summary(importer)).toHaveText("1 row ready to import.")
    await expect(importer.getByRole("combobox", { name: "Field for SPRING" })).toHaveText("Code")
  })

  test("a rejected import keeps the rows and a retry completes", async ({ page }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import discount codes")
    await paste(importer, "SPRING\t15\nLOYAL\t20")

    await importer.getByRole("button", { name: "Import 2 rows" }).click()
    await expect(importer.getByRole("button", { name: "Importing…" })).toBeDisabled()

    await expect(importer.getByRole("alert")).toHaveText(
      "The rows were not imported. They are still here, so you can try again. Reason: This preview rejects the first attempt."
    )
    await expect(importer.getByRole("button", { name: "Edit Code in row 2: LOYAL" })).toBeVisible()

    await importer.getByRole("button", { name: "Import 2 rows" }).click()
    await expect(importer.locator('[data-slot="paste-table-result"]')).toHaveText("2 rows imported.")
  })

  test("discarding returns to the paste field, and blank text offers nothing to preview", async ({ page }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import contacts")
    await paste(importer, contacts)

    await importer.getByRole("button", { name: "Discard paste" }).click()
    const field = importer.getByRole("textbox", { name: "Paste rows from a spreadsheet" })
    await expect(field).toBeFocused()

    await field.fill("   ")
    await expect(importer.getByRole("button", { name: "Preview rows" })).toHaveCount(0)
  })

  test("both steps have no detectable accessibility violations", async ({ page }) => {
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import contacts")

    const pasteStep = await new AxeBuilder({ page }).include('[data-slot="paste-table-root"]').analyze()
    expect(pasteStep.violations).toEqual([])

    await paste(importer, contacts)
    await expect(summary(importer)).toBeVisible()

    const reviewStep = await new AxeBuilder({ page }).include('[data-slot="paste-table-root"]').analyze()
    expect(reviewStep.violations).toEqual([])
  })

  test("the preview scrolls inside itself at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(docsPage)
    const importer = await mountImporter(page, "Import contacts")
    await paste(importer, contacts)

    await expect(importer.getByRole("button", { name: "Import 4 rows" })).toBeVisible()
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflows).toBe(false)
  })
})
