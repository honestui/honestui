import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("examples gallery links to the CRM preview", async ({ page }) => {
  await page.goto("/docs/examples");

  await expect(page.getByRole("heading", { name: "Examples", level: 1 })).toBeVisible();
  await expect(page.locator('[data-slot="card"]')).toBeVisible();
  await expect(page.locator('img[alt^="CRM client workspace"]:visible')).toBeVisible();
  await expect(page.getByText("CRM Client Workspace", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Preview example", exact: true }).click();
  await expect(page).toHaveURL(/\/examples\/crm-customer-list$/);
  await expect(page.getByRole("table", { name: "Client accounts" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(30);
});

test("examples card uses a preview image for the active theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/docs/examples");

  await expect(page.locator('img[alt^="CRM client workspace"]:visible')).toHaveAttribute(
    "src",
    /daybreak-client-workspace-connor-love/,
  );

  await page.evaluate(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.theme = "dark";
  });
  await expect(page.locator("html")).toHaveClass(/dark/);

  await expect(page.locator('img[alt^="CRM client workspace"]:visible')).toHaveAttribute(
    "src",
    /daybreak-client-workspace-dark-connor-love/,
  );
});

test("CRM preview keeps column resizing keyboard operable", async ({ page }) => {
  await page.goto("/examples/crm-customer-list", { waitUntil: "networkidle" });

  const companyHeader = page.getByRole("columnheader", { name: /Company/ });
  const resizeHandle = page.getByRole("button", { name: "Resize Company column" });
  const widthBefore = await companyHeader.evaluate((element) =>
    element.getBoundingClientRect().width,
  );

  await resizeHandle.focus();
  await resizeHandle.press("ArrowRight");

  await expect
    .poll(() => companyHeader.evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(widthBefore);
});

test("CRM profile and summary footers share the same height", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/examples/crm-customer-list");

  const profileFooter = page.locator('[data-example-footer="profile"]');
  const summaryFooter = page.locator('[data-example-footer="summary"]');
  const [profileBox, summaryBox] = await Promise.all([
    profileFooter.boundingBox(),
    summaryFooter.boundingBox(),
  ]);

  expect(profileBox).not.toBeNull();
  expect(summaryBox).not.toBeNull();
  expect(summaryBox?.height).toBe(profileBox?.height);
  expect(summaryBox?.y).toBe(profileBox?.y);
});

test("CRM workspace uses the revised sample data and sidebar copy", async ({ page }) => {
  await page.goto("/examples/crm-customer-list");

  await expect(page.getByRole("button", { name: /Daybreak/ })).toBeVisible();
  await expect(page.getByText("Dashboard", { exact: true })).toBeVisible();
  await expect(page.getByText("Clients", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Operations", { exact: true })).toBeVisible();
  await expect(page.getByText("Connor Love", { exact: true })).toBeVisible();
  await expect(page.getByText("Alder & Finch", { exact: true })).toBeVisible();
  await expect(page.getByText("Amara Okafor", { exact: true })).toBeVisible();
  await expect(page.getByText("184,250.00", { exact: true })).toBeVisible();
  await expect(page.getByText("Apr 8, 2026", { exact: true })).toBeVisible();
  await expect(page.getByText("Global Dynamics Corp", { exact: true })).toHaveCount(0);
  await expect(page.getByText("John Sir", { exact: true })).toHaveCount(0);
});

test("examples pages have no detectable WCAG A or AA violations", async ({ page }) => {
  for (const path of ["/docs/examples", "/examples/crm-customer-list"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22a",
        "wcag22aa",
      ])
      .analyze();

    expect(results.violations, path).toEqual([]);
  }
});
