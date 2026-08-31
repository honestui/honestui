import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function getDataTableDemo(page: Page, name: string): Promise<Locator> {
  const preview = page.locator(`[data-component-preview="${name}"]`);
  await preview.scrollIntoViewIfNeeded();

  const table = preview.locator('[data-slot="data-table"]');
  await expect(table).toBeVisible();
  return table;
}

test("data table cycles sortable columns through ascending, descending, and unsorted", async ({ page }) => {
  await page.goto("/docs/product/data-table");

  const demo = await getDataTableDemo(page, "data-table-demo");
  const customerHeader = demo.getByRole("columnheader", {
    name: /Sort by Customer/,
  });
  const customerSort = demo.getByRole("button", { name: "Sort by Customer" });

  await customerSort.click();
  await expect(customerHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(demo.getByRole("row").nth(1)).toContainText("Amelia Davis");

  await customerSort.click();
  await expect(customerHeader).toHaveAttribute("aria-sort", "descending");
  await expect(demo.getByRole("row").nth(1)).toContainText("Zara Ahmed");

  await customerSort.click();
  await expect(customerHeader).not.toHaveAttribute("aria-sort");
  await expect(demo.getByRole("row").nth(1)).toContainText("Olivia Rhye");
});

test("blank space in a sortable header does not activate sorting", async ({ page }) => {
  await page.goto("/docs/product/data-table");

  const demo = await getDataTableDemo(page, "data-table-demo");
  const spentHeader = demo.getByRole("columnheader", {
    name: /Sort by Spent/,
  });
  const bounds = await spentHeader.boundingBox();

  if (!bounds) {
    throw new Error("Spent header is not visible");
  }

  await spentHeader.click({
    position: { x: 2, y: bounds.height / 2 },
  });

  await expect(spentHeader).not.toHaveAttribute("aria-sort");
  await expect(demo.getByRole("row").nth(1)).toContainText("Olivia Rhye");
});

test("date columns sort their underlying dates instead of formatted labels", async ({
  page,
}) => {
  await page.goto("/docs/product/data-table");

  const customCellsDemo = await getDataTableDemo(
    page,
    "data-table-custom-cells",
  );
  const closeDateHeader = customCellsDemo.getByRole("columnheader", {
    name: /Sort by Close date/,
  });
  const closeDateSort = customCellsDemo.getByRole("button", {
    name: "Sort by Close date",
  });

  await closeDateSort.click();
  await expect(closeDateHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(customCellsDemo.getByRole("row").nth(1)).toContainText(
    "Jan 12, 2026",
  );

  await closeDateSort.click();
  await expect(closeDateHeader).toHaveAttribute("aria-sort", "descending");
  await expect(customCellsDemo.getByRole("row").nth(1)).toContainText(
    "Mar 21, 2026",
  );

  await closeDateSort.click();
  await expect(closeDateHeader).not.toHaveAttribute("aria-sort");
  await expect(customCellsDemo.getByRole("row").nth(1)).toContainText(
    "Olivia Rhye",
  );
});

test("search filters rows and clearing restores them", async ({ page }) => {
  await page.goto("/docs/product/data-table");

  const searchDemo = await getDataTableDemo(
    page,
    "data-table-search-filters",
  );

  const search = searchDemo.getByRole("searchbox", {
    name: "Search invoices",
  });
  await search.fill("Acme");
  await expect(searchDemo.getByRole("row")).toHaveCount(2);

  await search.fill("");
  await expect(searchDemo.getByRole("row")).toHaveCount(9);
});

test("selection summary appears and clears", async ({ page }) => {
  await page.goto("/docs/product/data-table");

  const selectionDemo = await getDataTableDemo(page, "data-table-selection");
  await selectionDemo
    .getByRole("checkbox", { name: "Select Olivia Rhye" })
    .click();
  await expect(
    selectionDemo.getByText("1 row selected"),
  ).toBeVisible();
  await selectionDemo.getByRole("button", { name: "Clear" }).click();
  await expect(selectionDemo.getByText("1 row selected")).toBeHidden();
});

test("filters menu toggles facet and shows count", async ({ page }) => {
  await page.goto("/docs/product/data-table");

  const filterDemo = await getDataTableDemo(
    page,
    "data-table-search-filters",
  );
  await filterDemo.getByRole("button", { name: /Filters/ }).click();
  await page
    .getByRole("menuitemcheckbox", { name: "Overdue" })
    .click();
  await expect(filterDemo.getByRole("button", { name: /Filters/ })).toContainText(
    "1",
  );
  await expect(filterDemo.getByRole("row")).toHaveCount(3);
});

test("columns menu changes column visibility", async ({ page }) => {
  await page.goto("/docs/product/data-table");

  const filterDemo = await getDataTableDemo(
    page,
    "data-table-search-filters",
  );
  await filterDemo.getByRole("button", { name: "Columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Customer" }).click();

  await expect(
    filterDemo.getByRole("columnheader", { name: /Sort by Customer/ }),
  ).toBeHidden();
});

test("server table paginates rows and resets after a page-size change", async ({
  page,
}) => {
  await page.goto("/docs/product/data-table");

  const serverDemo = await getDataTableDemo(page, "data-table-server");
  await expect(serverDemo.getByText("1-10 of 37")).toBeVisible();
  await expect(serverDemo.getByRole("row")).toHaveCount(11);

  await serverDemo
    .getByRole("button", { name: "Go to next page" })
    .click();
  await expect(serverDemo.getByText("11-20 of 37")).toBeVisible();
  await expect(serverDemo.getByRole("row").nth(1)).toContainText("SO-4110");

  await serverDemo.getByRole("combobox", { name: "Rows per page" }).click();
  await page.getByRole("option", { name: "20", exact: true }).click();

  await expect(serverDemo.getByText("1-20 of 37")).toBeVisible();
  await expect(serverDemo.getByRole("row")).toHaveCount(21);
  await expect(serverDemo.getByRole("row").nth(1)).toContainText("SO-4100");
});

test("docs page passes axe scan", async ({ page }) => {
  await page.goto("/docs/product/data-table");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag21a", "wcag22aa"])
    .analyze();
  const critical = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? ""),
  );
  expect(
    critical.map((v) => `${v.id}: ${v.nodes.length} nodes`),
  ).toEqual([]);
});
