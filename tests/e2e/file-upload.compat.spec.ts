import { expect, test } from "@playwright/test"

test("file picker selection and removal work across supported browsers", async ({
  page,
}) => {
  await page.goto("/docs/product/file-upload")

  const dropzone = page.locator("#file-upload-demo-zone")
  const input = page
    .locator('[data-slot="file-upload-root"]')
    .first()
    .locator('input[type="file"]')

  await expect(dropzone).toBeVisible()
  await expect(dropzone).toHaveAccessibleName(/Upload files/)

  await input.setInputFiles({
    name: "browser-check.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("browser compatibility check"),
  })

  const row = page
    .locator('[data-slot="file-upload-item"]')
    .filter({ hasText: "browser-check.pdf" })

  await expect(row).toHaveCount(1)
  await row
    .getByRole("button", { name: "Remove browser-check.pdf" })
    .click()
  await expect(row).toHaveCount(0)
  await expect(dropzone).toBeFocused()
})
