import { expect, test } from "@playwright/test";

const pages = [
  {
    path: "/docs/product/data-table",
    title: "DataTable",
    itemCount: 3,
  },
  {
    path: "/docs/product/data-grid",
    title: "DataGrid",
    itemCount: 6,
  },
];

for (const pageConfig of pages) {
  test(`${pageConfig.title} renders a semantic anatomy tree`, async ({ page }) => {
    await page.goto(pageConfig.path);

    const anatomy = page.locator('[data-slot="component-anatomy"]');
    await expect(anatomy).toBeVisible();
    await expect(anatomy.locator("figcaption")).toHaveText(pageConfig.title);
    await expect(anatomy.getByRole("listitem")).toHaveCount(
      pageConfig.itemCount,
    );
    await expect(anatomy).not.toContainText(/[├└│]/);
  });
}
