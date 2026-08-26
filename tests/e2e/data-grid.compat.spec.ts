import { expect, test } from "@playwright/test";

test("core controls work with pointer and touch-compatible actions", async ({
  page,
}) => {
  await page.goto("/docs/product/data-grid");

  const grid = page.locator('[data-slot="data-grid"]').first();
  const search = grid.getByRole("searchbox", { name: "Search users" });

  await search.fill("John Smith");
  await expect(grid.getByRole("row")).toHaveCount(2);
  await expect(grid.getByRole("row").nth(1)).toContainText("John Smith");
  await search.fill("");

  await grid.getByRole("button", { name: "Column options for Name" }).click();
  await page.getByRole("menuitem", { name: "Move right" }).click();
  await expect(grid.getByRole("columnheader").nth(1)).toContainText("Email");
  await expect(grid.getByRole("columnheader").nth(2)).toContainText("Name");
});

test("virtualized headers stay sticky in each supported engine", async ({
  page,
}) => {
  await page.goto("/docs/product/data-grid");
  await page
    .getByText("data-grid-virtualized", { exact: true })
    .scrollIntoViewIfNeeded();

  const table = page.getByRole("table", { name: "Application logs" });
  const viewport = table.locator(
    'xpath=ancestor::*[@data-slot="data-grid-viewport"]',
  );
  const header = table.getByRole("row").first();

  await expect(table).toHaveAttribute("aria-rowcount", "10001");
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
});

test("narrow layouts and forced colors preserve usable controls", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/docs/product/data-grid");

  const grid = page.locator('[data-slot="data-grid"]').first();
  const viewport = grid.locator('[data-slot="data-grid-viewport"]');
  const resizeHandle = grid.getByRole("separator", {
    name: "Resize Name column",
  });

  await expect(viewport).toBeVisible();
  await resizeHandle.focus();
  await expect(resizeHandle).toBeFocused();
  await expect(resizeHandle).toHaveAttribute("aria-valuemin", "170");
  await expect(resizeHandle).toHaveAttribute("aria-valuetext", /\d+ pixels/);
});
