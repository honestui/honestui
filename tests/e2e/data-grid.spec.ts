import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("search, sorting, and page selection work together", async ({ page }) => {
  await page.goto("/docs/product/data-grid");

  const grid = page.locator('[data-slot="data-grid"]').first();
  const search = grid.getByRole("searchbox", { name: "Search users" });
  const selectionHeader = grid.getByRole("columnheader").first();

  await expect(grid.getByRole("button", { name: "Add user" })).toHaveCount(0);
  await expect
    .poll(() =>
      selectionHeader.evaluate(
        (element) => getComputedStyle(element).borderInlineEndWidth,
      ),
    )
    .toBe("0px");
  await search.fill("John Smith");
  await expect(grid.getByRole("row")).toHaveCount(2);
  await expect(grid.getByRole("row").nth(1)).toContainText("John Smith");

  await search.fill("");
  const nameHeader = grid.getByRole("columnheader", { name: /Sort by Name/ });
  await grid.getByRole("button", { name: "Sort by Name" }).click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  await expect(grid.getByRole("row").nth(1)).toContainText("Alex Kim");

  await grid.getByRole("checkbox", { name: "Select all rows on this page" }).click();
  await expect(grid.getByText("8 rows selected")).toBeVisible();
  await expect(
    grid.getByRole("checkbox", {
      name: "Select John Smith. This user cannot be changed.",
    }),
  ).toBeDisabled();
});

test("column controls support keyboard resizing and visibility", async ({ page }) => {
  await page.goto("/docs/product/data-grid");

  const grid = page.locator('[data-slot="data-grid"]').first();
  const nameHeader = grid.getByRole("columnheader", { name: /Sort by Name/ });
  const resizeHandle = grid.getByRole("separator", {
    name: "Resize Name column",
  });
  const widthBefore = await nameHeader.evaluate((element) =>
    element.getBoundingClientRect().width,
  );

  await resizeHandle.focus();
  await expect(resizeHandle).toHaveAttribute("aria-valuemin", "170");
  await expect(resizeHandle).toHaveAttribute("aria-valuemax");
  await expect(resizeHandle).toHaveAttribute("aria-valuetext", /\d+ pixels/);
  const valueBefore = Number(await resizeHandle.getAttribute("aria-valuenow"));
  await resizeHandle.press("ArrowRight");
  await expect
    .poll(() =>
      nameHeader.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(widthBefore);
  await expect
    .poll(async () => Number(await resizeHandle.getAttribute("aria-valuenow")))
    .toBeGreaterThan(valueBefore);

  const widthAfterKeyboardResize = await nameHeader.evaluate((element) =>
    element.getBoundingClientRect().width,
  );
  const resizeBounds = await resizeHandle.boundingBox();
  if (!resizeBounds) throw new Error("Name resize handle is not visible");

  await page.mouse.move(
    resizeBounds.x + resizeBounds.width / 2,
    resizeBounds.y + resizeBounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(resizeBounds.x + 48, resizeBounds.y + 4, {
    steps: 5,
  });
  await page.mouse.up();

  await expect
    .poll(() =>
      nameHeader.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(widthAfterKeyboardResize);
  const widthAfterPointerResize = await nameHeader.evaluate((element) =>
    element.getBoundingClientRect().width,
  );
  await page.mouse.move(resizeBounds.x + 140, resizeBounds.y + 4);
  await expect
    .poll(() =>
      nameHeader.evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBe(widthAfterPointerResize);
  await expect(resizeHandle).not.toHaveAttribute("data-resizing", "true");
  await expect(grid.getByRole("columnheader").nth(1)).toContainText("Name");

  const emailHeader = grid.getByRole("columnheader", { name: /Sort by Email/ });
  await emailHeader
    .locator('[data-slot="data-grid-column-drag-region"]')
    .dragTo(nameHeader.locator('[data-slot="data-grid-column-drag-region"]'));
  await expect(grid.getByRole("columnheader").nth(1)).toContainText("Email");

  await grid.getByRole("button", { name: "Columns" }).click();
  await page.getByRole("menuitemcheckbox", { name: "Email" }).click();
  await expect(
    grid.getByRole("columnheader", { name: /Sort by Email/ }),
  ).toBeHidden();
});

test("Tab saves an edited value and moves to the next cell", async ({ page }) => {
  await page.goto("/docs/product/data-grid");

  await page
    .getByText("data-grid-editing", { exact: true })
    .scrollIntoViewIfNeeded();
  const grid = page.getByRole("table", { name: "Editable projects" });
  const projectCell = grid.getByRole("cell", { name: "Account migration" });

  await projectCell.dblclick();
  const editor = grid.getByRole("textbox", { name: "Edit Project" });
  await editor.fill("Account transfer");
  await editor.press("Tab");

  await expect(grid.getByRole("cell", { name: "Account transfer" })).toBeVisible();
  await expect(grid.getByRole("cell", { name: "Sarah Chen" })).toBeFocused();
});

test("choosing a status saves without save or cancel buttons", async ({ page }) => {
  await page.goto("/docs/product/data-grid");

  await page
    .getByText("data-grid-editing", { exact: true })
    .scrollIntoViewIfNeeded();
  const grid = page.getByRole("table", { name: "Editable projects" });
  const firstRow = grid.getByRole("row").nth(1);

  await firstRow.getByRole("cell", { name: "Active" }).dblclick();
  await expect(firstRow.getByRole("button", { name: "Save" })).toHaveCount(0);
  await expect(firstRow.getByRole("button", { name: "Cancel" })).toHaveCount(0);
  await firstRow.getByRole("combobox", { name: "Edit status" }).click();
  await page.getByRole("option", { name: "Paused" }).click();

  await expect(firstRow.getByRole("cell", { name: "Paused" })).toBeVisible();
});

test("right-aligned headers align with their cell values", async ({ page }) => {
  await page.goto("/docs/product/data-grid");

  await page
    .getByText("data-grid-editing", { exact: true })
    .scrollIntoViewIfNeeded();
  const table = page.getByRole("table", { name: "Editable projects" });
  const alignmentDifference = await table.evaluate((element) => {
    const header = element.querySelector(
      '[aria-label="Sort by Budget"]',
    )?.closest("th");
    const sortIndicator = header?.querySelector("svg");
    const valueCell = element.querySelector("tbody tr td:last-child");
    if (!sortIndicator || !valueCell) return Number.POSITIVE_INFINITY;

    const valueRange = document.createRange();
    valueRange.selectNodeContents(valueCell);
    return Math.abs(
      sortIndicator.getBoundingClientRect().right -
        valueRange.getBoundingClientRect().right,
    );
  });

  expect(alignmentDifference).toBeLessThan(1);
  await table
    .getByRole("button", { name: "Column options for Budget" })
    .focus();
  await expect(
    table.getByRole("button", { name: "Column options for Budget" }),
  ).toBeFocused();
});

test("empty states use Empty and stay centered in the visible viewport", async ({
  page,
}) => {
  await page.goto("/docs/product/data-grid");

  await page
    .getByText("data-grid-controlled", { exact: true })
    .scrollIntoViewIfNeeded();
  const controlledTable = page.getByRole("table", {
    name: "Server-controlled users",
  });
  const controlledGrid = controlledTable.locator(
    'xpath=ancestor::*[@data-slot="data-grid"]',
  );
  await controlledGrid
    .getByRole("searchbox", { name: "Search users" })
    .fill("sae");

  const filteredEmpty = controlledTable.locator('[data-slot="empty"]');
  await expect(filteredEmpty).toContainText("No matching rows");
  await expect(
    filteredEmpty.locator('[data-slot="empty-content"]'),
  ).toContainText("Clear filters");
  const tableContainer = controlledTable.locator(
    'xpath=ancestor::*[@data-slot="table-container"]',
  );
  await tableContainer.evaluate((element) => {
    element.scrollLeft = 240;
  });
  await expect
    .poll(() =>
      controlledTable.evaluate((table) => {
        const empty = table.querySelector('[data-slot="empty"]');
        const viewport = table.closest('[data-slot="data-grid-viewport"]');
        if (!empty || !viewport) return Number.POSITIVE_INFINITY;
        const emptyRect = empty.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        return Math.abs(
          emptyRect.left + emptyRect.width / 2 -
            (viewportRect.left + viewportRect.width / 2),
        );
      }),
    )
    .toBeLessThan(1);

  await page
    .getByText("data-grid-states", { exact: true })
    .scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Empty", exact: true }).click();
  const customTable = page.getByRole("table", {
    name: "User loading states",
  });
  const customEmpty = customTable.locator('[data-slot="empty"]');
  await expect(customEmpty).toContainText("No users yet");
  await expect
    .poll(() =>
      customTable.evaluate((table) => {
        const empty = table.querySelector('[data-slot="empty"]');
        const viewport = table.closest('[data-slot="data-grid-viewport"]');
        if (!empty || !viewport) return Number.POSITIVE_INFINITY;
        const emptyRect = empty.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        return Math.abs(
          emptyRect.left + emptyRect.width / 2 -
            (viewportRect.left + viewportRect.width / 2),
        );
      }),
    )
    .toBeLessThan(1);
});

test("virtualization keeps the rendered row count bounded", async ({ page }) => {
  await page.goto("/docs/product/data-grid");

  await page
    .getByText("data-grid-virtualized", { exact: true })
    .scrollIntoViewIfNeeded();
  const grid = page.getByRole("table", { name: "Application logs" });
  const viewport = grid.locator(
    'xpath=ancestor::*[@data-slot="data-grid-viewport"]',
  );
  const header = grid.getByRole("row").first();
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute("aria-rowcount", "10001");
  await expect(header).toHaveAttribute("aria-rowindex", "1");
  await expect.poll(() => grid.getByRole("row").count()).toBeGreaterThan(1);
  expect(await grid.getByRole("row").count()).toBeLessThan(40);

  await viewport.evaluate((element) => {
    element.scrollTop = 500;
  });
  await expect
    .poll(() =>
      header.evaluate((element) => {
        const viewport = element.closest('[data-slot="data-grid-viewport"]');
        if (!viewport) return Number.POSITIVE_INFINITY;
        return Math.abs(
          element.getBoundingClientRect().top -
            viewport.getBoundingClientRect().top,
        );
      }),
    )
    .toBeLessThan(1);

  const visibleDataRows = grid.locator("tbody tr[aria-rowindex]");
  await expect.poll(() => visibleDataRows.count()).toBeGreaterThan(0);
  const renderedIndexes = await visibleDataRows.evaluateAll((rows) =>
    rows.map((row) => Number(row.getAttribute("aria-rowindex"))),
  );
  expect(Math.max(...renderedIndexes)).toBeGreaterThan(2);
  expect(Math.max(...renderedIndexes)).toBeLessThanOrEqual(10001);
  expect(renderedIndexes).toEqual([...renderedIndexes].sort((a, b) => a - b));
});

test("docs page has no serious axe violations", async ({ page }) => {
  await page.goto("/docs/product/data-grid");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag21a", "wcag22aa"])
    .analyze();
  const critical = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact ?? ""),
  );

  expect(
    critical.map((violation) => `${violation.id}: ${violation.nodes.length} nodes`),
  ).toEqual([]);
});
