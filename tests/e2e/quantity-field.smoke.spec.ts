import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

type Page = import("@playwright/test").Page
type Locator = import("@playwright/test").Locator

const docsPage = "/docs/product/quantity-field"

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

/** One quantity field, found by its label. */
function quantityField(page: Page, label: string) {
  const group = page.getByRole("group", { name: label })
  const root = group.locator('xpath=ancestor::*[@data-slot="quantity-field"][1]')

  return {
    group,
    input: group.getByRole("textbox", { name: label }),
    unit: group.getByRole("combobox", { name: `${label} unit` }),
    status: root.getByRole("status"),
  }
}

async function openField(page: Page, label: string) {
  await page.goto(docsPage)
  const field = quantityField(page, label)
  await mountPreview(page, field.group)
  await expect(field.input).toBeEnabled()
  return field
}

async function chooseUnit(page: Page, field: ReturnType<typeof quantityField>, option: string) {
  await field.unit.click()
  await page.getByRole("option", { name: option }).click()
}

/**
 * Replaces the number by typing. `fill` cannot be used: the number field moves
 * the caret to the end on first focus, which turns a fill into an append.
 */
async function enter(input: Locator, text: string) {
  await input.click()
  await input.press("ControlOrMeta+a")
  if (text === "") {
    await input.press("Backspace")
  } else {
    await input.pressSequentially(text)
  }
}

/** Chromium does not let a test write the clipboard without a permission prompt, so dispatch the event the browser would. */
async function paste(input: Locator, text: string) {
  await input.focus()
  await input.evaluate((element, pasted) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData("text/plain", pasted)
    element.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true })
    )
  }, text)
}

test.describe("Quantity Field docs previews", () => {
  test("switching the unit converts the number and keeps the stored value", async ({ page }) => {
    const field = await openField(page, "Session timeout")
    const stored = page.getByTestId("stored-seconds")

    await expect(field.input).toHaveValue("90")
    await expect(field.unit).toHaveText("min")
    await expect(field.status).toBeEmpty()

    await chooseUnit(page, field, "Hours (h)")

    await expect(field.input).toHaveValue("1.5")
    await expect(field.unit).toHaveText("h")
    await expect(stored).toHaveText("5400 seconds")
    await expect(field.status).toHaveText("90 min is 1.5 h.")
  })

  test("the number is described by its unit and by the status", async ({ page }) => {
    const field = await openField(page, "Session timeout")

    await expect(field.input).toHaveAccessibleDescription("Minutes")
    await chooseUnit(page, field, "Hours (h)")
    await expect(field.input).toHaveAccessibleDescription("Hours 90 min is 1.5 h.")
  })

  test("a pasted value brings its unit, and focus stays in the number", async ({ page }) => {
    const field = await openField(page, "Session timeout")
    const stored = page.getByTestId("stored-seconds")

    await paste(field.input, "2 h")

    await expect(field.input).toHaveValue("2")
    await expect(field.unit).toHaveText("h")
    await expect(stored).toHaveText("7200 seconds")
    await expect(field.status).toBeEmpty()
    await expect(field.input).toBeFocused()

    await paste(field.input, "1h 30m")

    await expect(field.input).toHaveValue("90")
    await expect(field.unit).toHaveText("min")
    await expect(stored).toHaveText("5400 seconds")
    await expect(field.status).toHaveText("“1h 30m” was pasted as 90 min.")
  })

  test("a pasted value replaces text that was typed and not yet committed", async ({ page }) => {
    const field = await openField(page, "Session timeout")

    await enter(field.input, "45")
    await paste(field.input, "3 h")

    await expect(field.input).toHaveValue("3")
    await expect(page.getByTestId("stored-seconds")).toHaveText("10800 seconds")
  })

  test("a paste that cannot be read is refused and leaves the value alone", async ({ page }) => {
    const field = await openField(page, "Session timeout")

    await paste(field.input, "5 GB")

    await expect(field.input).toHaveValue("90")
    await expect(page.getByTestId("stored-seconds")).toHaveText("5400 seconds")
    await expect(field.status).toHaveText(
      "“5 GB” was not pasted because it could not be read. Use a number with one of these units: min, h, d."
    )
    await expect(field.input).toHaveAttribute("aria-invalid", "true")

    await enter(field.input, "60")
    await expect(field.status).toBeEmpty()
    await expect(field.input).not.toHaveAttribute("aria-invalid", "true")
  })

  test("a typed value past the limit is kept and reported, and a step returns to the limit", async ({
    page,
  }) => {
    const field = await openField(page, "Session timeout")
    const stored = page.getByTestId("stored-seconds")
    await chooseUnit(page, field, "Hours (h)")

    await enter(field.input, "30")
    // No error while the number is still being typed.
    await expect(field.status).toBeEmpty()
    await field.input.blur()

    await expect(field.input).toHaveValue("30")
    await expect(stored).toHaveText("108000 seconds")
    await expect(field.status).toHaveText("Enter 24 h or less.")
    await expect(field.input).toHaveAttribute("aria-invalid", "true")
    expect(await field.input.evaluate((el: HTMLInputElement) => el.validationMessage)).toBe(
      "Enter 24 h or less."
    )

    await field.input.press("ArrowDown")

    await expect(field.input).toHaveValue("24")
    await expect(stored).toHaveText("86400 seconds")
    await expect(field.status).toBeEmpty()
    await expect(field.group.getByRole("button", { name: "Increase" })).toBeDisabled()
    expect(await field.input.evaluate((el: HTMLInputElement) => el.validationMessage)).toBe("")
  })

  test("the lower limit is stated in a unit that shows it exactly", async ({ page }) => {
    const field = await openField(page, "Session timeout")
    await chooseUnit(page, field, "Days (d)")

    await enter(field.input, "0")
    await field.input.blur()

    await expect(field.status).toHaveText("Enter 1 min or more.")
  })

  test("a rounded number says so and survives focus without changing the stored value", async ({
    page,
  }) => {
    const field = await openField(page, "Report window")
    const stored = page.getByTestId("stored-window")

    await expect(field.input).toHaveValue("1.7")
    await expect(field.status).toHaveText("Shown rounded. The exact value is 100 min.")

    await field.input.focus()
    await field.input.blur()
    await expect(stored).toHaveText("6000 seconds")
    await expect(field.input).toHaveValue("1.7")

    // One hour more than 100 minutes is 160 minutes, not 2.7 hours.
    await field.input.press("ArrowUp")
    await expect(stored).toHaveText("9600 seconds")
    await expect(field.input).toHaveValue("2.7")
    await expect(field.status).toHaveText("Shown rounded. The exact value is 160 min.")

    await chooseUnit(page, field, "Minutes (min)")
    await expect(field.input).toHaveValue("160")
    await expect(field.status).toBeEmpty()
  })

  test("typing the number stores what was typed", async ({ page }) => {
    const field = await openField(page, "Report window")

    await enter(field.input, "1.7")
    await field.input.blur()

    await expect(page.getByTestId("stored-window")).toHaveText("6120 seconds")
    await expect(field.status).toBeEmpty()
  })

  test("binary units convert exactly, and a pasted decimal unit is converted with a note", async ({
    page,
  }) => {
    const field = await openField(page, "Largest upload")
    const stored = page.getByTestId("stored-bytes")

    await expect(field.input).toHaveValue("1,024")
    await chooseUnit(page, field, "Gibibytes (GiB)")
    await expect(field.input).toHaveValue("1")
    await expect(stored).toHaveText("1073741824 bytes")
    await expect(field.status).toHaveText("1,024 MiB is 1 GiB.")

    await chooseUnit(page, field, "Mebibytes (MiB)")
    await paste(field.input, "500 MB")

    await expect(field.input).toHaveValue("476.84")
    await expect(field.unit).toHaveText("MiB")
    await expect(stored).toHaveText("500000000 bytes")
    await expect(field.status).toHaveText(
      "“500 MB” was pasted as 476.84 MiB. Shown rounded. The exact value is 488,281.25 KiB."
    )

    await paste(field.input, "500 Mb")
    await expect(field.status).toContainText("“500 Mb” was not pasted")
    await expect(stored).toHaveText("500000000 bytes")
  })

  test("the form submits the stored value, whichever unit is shown", async ({ page }) => {
    const quota = await openField(page, "Storage quota")
    const submitted = page.getByRole("status", { name: "Submitted form data" })
    const save = page.getByRole("button", { name: "Save limits" })

    await expect(quota.input).toHaveValue("2")
    await save.click()
    await expect(submitted).toHaveText("quota_megabytes=2000retention_days=30")

    await chooseUnit(page, quota, "Megabytes (MB)")
    await expect(quota.input).toHaveValue("2,000")
    await enter(quota.input, "2500")
    await save.click()
    await expect(submitted).toHaveText("quota_megabytes=2500retention_days=30")
  })

  test("the form is not submitted while a value is out of range or missing", async ({ page }) => {
    const quota = await openField(page, "Storage quota")
    const submitted = page.getByRole("status", { name: "Submitted form data" })
    const save = page.getByRole("button", { name: "Save limits" })

    await enter(quota.input, "20")
    await save.click()
    await expect(quota.status).toHaveText("Enter 10 GB or less.")
    await expect(submitted).toBeEmpty()

    await enter(quota.input, "")
    await save.click()
    await expect(submitted).toBeEmpty()

    await enter(quota.input, "4")
    await save.click()
    await expect(submitted).toHaveText("quota_megabytes=4000retention_days=30")
  })

  test("a field with one unit shows it as text and converts a pasted unit", async ({ page }) => {
    await openField(page, "Storage quota")
    const group = page.getByRole("group", { name: "Keep deleted files for" })
    const input = group.getByRole("textbox", { name: "Keep deleted files for" })
    const status = group
      .locator('xpath=ancestor::*[@data-slot="quantity-field"][1]')
      .getByRole("status")

    await expect(group.getByRole("combobox")).toHaveCount(0)
    await expect(group.locator('[data-slot="quantity-field-unit"]')).toHaveText("d")
    await expect(input).toHaveAccessibleDescription("Days")

    await paste(input, "2 wk")

    await expect(input).toHaveValue("14")
    await expect(status).toHaveText("“2 wk” was pasted as 14 d.")
  })

  test("the previews have no automatically detectable accessibility violations", async ({
    page,
  }) => {
    const field = await openField(page, "Session timeout")
    await chooseUnit(page, field, "Hours (h)")
    await enter(field.input, "30")
    await field.input.blur()
    await expect(field.status).toHaveText("Enter 24 h or less.")

    const results = await new AxeBuilder({ page }).include('[data-slot="quantity-field"]').analyze()

    expect(results.violations).toEqual([])
  })

  test("the control and its status fit a phone-width screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    const field = await openField(page, "Largest upload")

    await paste(field.input, "500 MB")
    await expect(field.status).toContainText("Shown rounded.")

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)

    const box = await field.unit.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(24)
    expect(box?.width).toBeGreaterThanOrEqual(24)
  })

  test("the unit can be changed with the keyboard alone", async ({ page }) => {
    const field = await openField(page, "Session timeout")

    await field.input.focus()
    await page.keyboard.press("Tab")
    await expect(field.unit).toBeFocused()

    await page.keyboard.press("Enter")
    await page.getByRole("option", { name: "Hours (h)" }).waitFor()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(field.unit).toHaveText("h")
    await expect(field.input).toHaveValue("1.5")

    await field.input.focus()
    await page.keyboard.press("Shift+ArrowUp")
    await expect(field.input).toHaveValue("11.5")
  })
})
