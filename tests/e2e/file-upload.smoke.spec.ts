import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const docsPage = "/docs/product/file-upload"

function fileInput(page: import("@playwright/test").Page, rootIndex = 0) {
  return page
    .locator('[data-slot="file-upload-root"]')
    .nth(rootIndex)
    .locator('input[type="file"]')
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#476"/></svg>`

/**
 * Previews lazy-mount while scrolled near the viewport, so drive wheel
 * events until a root containing `text` exists, bouncing home twice so
 * skipped intersections fire again on the way past.
 */
async function mountRootContaining(
  page: import("@playwright/test").Page,
  text: string
) {
  const candidate = page
    .locator('[data-slot="file-upload-root"]')
    .filter({ hasText: text })

  await page.mouse.move(700, 400)

  for (let i = 0; i < 240; i += 1) {
    if ((await candidate.count()) === 1) return candidate

    if (i === 70 || i === 150) {
      await page.keyboard.press("Home")
      await page.waitForTimeout(200)
    }

    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(120)
  }

  throw new Error(`no preview root containing "${text}" mounted`)
}

test.describe("File Upload docs previews", () => {
  test("dropzone opens the native file picker", async ({ page }) => {
    await page.goto(docsPage)

    const dropzone = page.locator('[data-slot="file-upload-dropzone"]').first()
    await expect(dropzone).toBeVisible()

    const fileChooserPromise = page.waitForEvent("filechooser")
    await dropzone.click()
    const fileChooser = await fileChooserPromise

    await fileChooser.setFiles({
      name: "receipt.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("sample receipt"),
    })

    await expect(
      page.locator('[data-slot="file-upload-item"]').filter({
        hasText: "receipt.pdf",
      })
    ).toHaveCount(1)
  })

  test("default demo accepts sample picks, lists them, and removes them", async ({
    page,
  }) => {
    await page.goto(docsPage)

    const dropzone = page.locator('[data-slot="file-upload-dropzone"]').first()
    await expect(dropzone).toBeVisible()
    await expect(dropzone).toContainText("Drop files here or click to browse")

    // The sample affordance rides the real input pipeline, so it works even
    // where native choosers are blocked.
    await page.getByRole("button", { name: "Try a sample file" }).click()

    const rows = page.locator('[data-slot="file-upload-item"]')
    await expect(rows).toHaveCount(2)
    await expect(
      page.locator('[data-slot="field-description"]').first()
    ).toContainText("2 of 5 files selected")

    // Removing the last row returns keyboard focus to the dropzone.
    await rows.filter({ hasText: "meadow-shot.png" })
      .getByRole("button", { name: "Remove meadow-shot.png" })
      .click()
    await expect(rows).toHaveCount(1)

    await rows.getByRole("button", { name: "Remove trip-deck.pdf" }).click()
    await expect(rows).toHaveCount(0)
    await expect(dropzone).toBeFocused()
  })

  test("unsupported and oversized samples land as explained rejections", async ({
    page,
  }) => {
    await page.goto(docsPage)

    const rejectedDemo = await mountRootContaining(
      page,
      "Drop a photo to test rejection"
    )
    await rejectedDemo.scrollIntoViewIfNeeded()
    await page.getByRole("button", { name: "Try two broken samples" }).click()

    const rejectedRows = page.locator('[data-slot="file-upload-rejected-row"]')
    await expect(rejectedRows).toHaveCount(2)
    await expect(rejectedRows.filter({ hasText: "beach-photo.png" })).toContainText(
      "File is too large. Maximum is 1 MB."
    )
    await expect(rejectedRows.filter({ hasText: "product-demo.mov" })).toContainText(
      "File type is not supported. Choose PNG or JPG."
    )

    // Rejected rows leave through their own dismissal, not the selection.
    await rejectedRows
      .filter({ hasText: "product-demo.mov" })
      .getByRole("button", { name: "Remove product-demo.mov" })
      .click()
    await expect(rejectedRows).toHaveCount(1)

    const remainingRemove = rejectedRows.getByRole("button", {
      name: "Remove beach-photo.png",
    })
    await expect(remainingRemove).toBeFocused()
    await remainingRemove.click()
    await expect(rejectedRows).toHaveCount(0)
    await expect(
      rejectedDemo.locator('[data-slot="file-upload-dropzone"]')
    ).toBeFocused()

    await rejectedDemo.locator('input[type="file"]').setInputFiles([
      { name: "one.png", mimeType: "image/png", buffer: Buffer.from("one") },
      { name: "two.png", mimeType: "image/png", buffer: Buffer.from("two") },
      { name: "three.png", mimeType: "image/png", buffer: Buffer.from("three") },
    ])

    const selectionError = rejectedDemo.locator(
      '[data-slot="file-upload-selection-error"]'
    )
    await expect(selectionError).toHaveAttribute("id", /.+/)

    const selectionErrorId = await selectionError.getAttribute("id")

    expect(selectionErrorId).not.toBeNull()
    await expect(
      rejectedDemo.locator('[data-slot="file-upload-dropzone"]')
    ).toHaveAttribute("aria-describedby", selectionErrorId!)
  })

  test("clear all preserves focus on the remaining picker action", async ({
    page,
  }) => {
    await page.goto(docsPage)

    await mountRootContaining(page, "campsite-photo.svg")
    const selectedRoot = page.locator("#file-upload-selected")
    const addMore = selectedRoot.getByRole("button", { name: "Add more files" })

    await selectedRoot.getByRole("button", { name: "Clear all" }).click()

    await expect(selectedRoot.locator('[data-slot="file-upload-item"]')).toHaveCount(0)
    await expect(addMore).toBeFocused()
  })

  test("failed rows expose Retry and announce the completed retry", async ({
    page,
  }) => {
    await page.goto(docsPage)

    const statesRoot = await mountRootContaining(page, "invoice-march.pdf")
    const invoiceRow = statesRoot
      .locator('[data-slot="file-upload-item"]')
      .filter({ hasText: "invoice-march.pdf" })

    await invoiceRow.getByRole("button", { name: "Retry" }).click()
    await expect(invoiceRow).toContainText("Uploading")
    await expect(statesRoot.getByRole("status")).toContainText(
      "invoice-march.pdf uploaded.",
      { timeout: 5_000 }
    )
  })

  test("field labels and descriptions target the dropzone button", async ({
    page,
  }) => {
    await page.goto(docsPage)

    const defaultDropzone = page.locator("#file-upload-demo-zone")

    await expect(defaultDropzone).toHaveAttribute(
      "data-slot",
      "file-upload-dropzone"
    )
    await expect(
      page.locator('label[for="file-upload-demo-zone"]')
    ).toHaveText("Upload files")
    await expect(defaultDropzone).toHaveAttribute(
      "aria-describedby",
      "file-upload-demo-status"
    )

    const disabledRoot = await mountRootContaining(
      page,
      "File upload is disabled"
    )
    const disabledDropzone = disabledRoot.locator("#file-upload-disabled-zone")

    await expect(
      page.locator('label[for="file-upload-disabled-zone"]')
    ).toHaveText("Locked attachments")
    await expect(disabledDropzone).toBeDisabled()
    await expect(disabledDropzone).toHaveAttribute(
      "aria-describedby",
      "lock-note"
    )
  })

  test("populated uploader has no detectable WCAG A or AA violations", async ({
    page,
  }) => {
    await page.goto(docsPage)

    await page
      .locator('[data-slot="file-upload-dropzone"]')
      .first()
      .scrollIntoViewIfNeeded()

    await fileInput(page).setInputFiles([
      { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from(SAMPLE_SVG) },
    ])

    await expect(page.locator('[data-slot="file-upload-item"]').first()).toBeVisible()

    const results = await new AxeBuilder({ page })
      .include('[data-slot="file-upload-root"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test("seeded lists use tiles while the image example decodes its stock images", async ({
    page,
  }) => {
    const duplicateKeyErrors: string[] = []

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        message.text().includes("Encountered two children with the same key")
      ) {
        duplicateKeyErrors.push(message.text())
      }
    })

    await page.goto(docsPage)

    const selectedRoot = await mountRootContaining(page, "campsite-photo.svg")
    await expect(
      selectedRoot.locator('[data-slot="file-upload-item-preview"]')
    ).toContainText(["SVG", "PDF", "DOCX"])
    await expect(selectedRoot.locator('img[data-slot="file-upload-item-preview"]')).toHaveCount(0)

    const statesRoot = await mountRootContaining(page, "team-expenses.jpg")
    const jpgRow = statesRoot
      .locator('[data-slot="file-upload-item"]')
      .filter({ hasText: "team-expenses.jpg" })
    await expect(jpgRow.locator('[data-slot="file-upload-item-preview"]')).toContainText(
      "JPG"
    )
    await expect(jpgRow.locator("img")).toHaveCount(0)
    expect(duplicateKeyErrors).toEqual([])

    const imagesRoot = await mountRootContaining(page, "harbor-boats.jpg")
    const svgPreview = imagesRoot
      .locator('[data-slot="file-upload-item"]')
      .filter({ hasText: "sunset-watch.svg" })
      .locator('img[data-slot="file-upload-item-preview"]')
    const jpgPreview = imagesRoot
      .locator('[data-slot="file-upload-item"]')
      .filter({ hasText: "harbor-boats.jpg" })
      .locator('img[data-slot="file-upload-item-preview"]')

    for (const preview of [svgPreview, jpgPreview]) {
      await expect(preview).toHaveJSProperty("complete", true)
      expect(
        await preview.evaluate((image: HTMLImageElement) => image.naturalWidth)
      ).toBeGreaterThan(0)
    }
  })

  test("single-file layout swaps its empty state for a working Replace", async ({
    page,
  }) => {
    await page.goto(docsPage)

    const singleRoot = await mountRootContaining(page, "Drop a file or browse")

    const input = singleRoot.locator('input[type="file"]')

    // The example's PNG/JPG rule rejects this gesture with visible copy.
    await input.setInputFiles([
      { name: "portrait.svg", mimeType: "image/svg+xml", buffer: Buffer.from(SAMPLE_SVG) },
    ])
    await expect(singleRoot.locator('[data-slot="file-upload-rejected-row"]')).toHaveCount(1)

    // Accepting replaces the empty state, so the old zone text vanishes and
    // the stale root locator would match nothing; move up to page scope.
    await input.setInputFiles([
      { name: "portrait.png", mimeType: "image/png", buffer: Buffer.from(SAMPLE_SVG) },
    ])

    const replace = page.getByRole("button", { name: "Replace" })
    await expect(replace).toBeVisible()
    await expect(replace).toBeEnabled()
    await expect(
      page
        .locator('[data-slot="file-upload-item"]')
        .filter({ hasText: "portrait.png" })
    ).toHaveCount(1)
  })
})
