import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

test("searches every icon category and ranks exact names first", async ({ page }) => {
  await page.goto("/docs/icons");

  const main = page.locator("#docs-main-content");
  const search = page.getByRole("searchbox", { name: "Search icons by name" });
  await expect(search).toBeVisible();
  await expect(main.getByRole("heading", { level: 2, name: "Align" })).toBeVisible();

  await search.fill("arrow right");
  await expect(main.getByText(/\d+ icons match “arrow right”/)).toBeVisible();

  const firstResult = main.locator("section li button").first();
  await expect(firstResult).toHaveAttribute("title", "ArrowRight");

  await firstResult.click();
  await expect(firstResult).toHaveAttribute("aria-pressed", "true");

  const detail = page.getByRole("dialog", { name: "Arrow Right" });
  await expect(detail).toContainText('import { ArrowRight } from "honestui/icons";');
  await expect(detail.getByRole("button", { name: "ArrowRightFilled" })).toBeVisible();
  await expect(page).toHaveURL(/q=arrow\+right.*icon=ArrowRight/);

  // The floating panel is not modal: another tile stays clickable behind it.
  await main.locator("section li button").nth(1).click();
  await expect(page.getByRole("dialog", { name: "Arrow Right" })).toContainText("ArrowRightDoodle");
});

test("restores the search, style, and selection from the URL", async ({ page }) => {
  await page.goto("/docs/icons?q=home&style=rounded&icon=HomeRounded");

  await expect(page.getByRole("searchbox")).toHaveValue("home");
  await expect(page.getByText(/\d+ icons match “home” in Rounded style/)).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Home" })).toContainText("HomeRounded");
});

test("offers a collection-wide search when a category has no match", async ({ page }) => {
  await page.goto("/docs/icons/categories/zodiac?q=arrow");

  await expect(page.getByText("No Zodiac icons match this search")).toBeVisible();
  await page.getByRole("link", { name: "Search all icons" }).click();

  await expect(page).toHaveURL(/\/docs\/icons\?q=arrow/);
  await expect(page.locator("#docs-main-content section li button").first()).toBeVisible();
});

test("opens details in a dialog on narrow screens and returns focus on close", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/icons/logos?q=vercel");

  const firstResult = page.locator("#docs-main-content section li button").first();
  await firstResult.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Vercel" });
  await expect(dialog).toContainText("honestui/logos");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(firstResult).toBeFocused();
});

test("keeps the written guides reachable beside the collection routes", async ({ request }) => {
  for (const path of ["/docs/icons/usage", "/docs/icons/installation", "/docs/icons.md"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});
