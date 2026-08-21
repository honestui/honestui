import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("examples gallery links to the CRM preview", async ({ page }) => {
  await page.goto("/docs/examples");

  await expect(page.getByRole("heading", { name: "Examples", level: 1 })).toBeVisible();
  await expect(page.locator('[data-slot="card"]')).toHaveCount(2);
  await expect(page.locator('img[alt^="CRM client workspace"]:visible')).toBeVisible();
  await expect(page.getByText("CRM Client Workspace", { exact: true })).toBeVisible();
  await expect(page.getByText("AI Assistant Workspace", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Preview CRM Client Workspace" }).click();
  await expect(page).toHaveURL(/\/examples\/crm-customer-list$/);
  await expect(page.getByRole("table", { name: "Client accounts" })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(30);
});

test("examples card uses a preview image for the active theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/docs/examples");

  await expect(page.locator('img[alt^="CRM client workspace"]:visible')).toHaveAttribute(
    "src",
    /crm-client-workspace/,
  );
  await expect(page.locator('img[alt^="AI assistant workspace"]:visible')).toHaveAttribute(
    "src",
    /ai-assistant-workspace/,
  );

  await page.evaluate(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.documentElement.dataset.theme = "dark";
  });
  await expect(page.locator("html")).toHaveClass(/dark/);

  await expect(page.locator('img[alt^="CRM client workspace"]:visible')).toHaveAttribute(
    "src",
    /crm-client-workspace-dark/,
  );
  await expect(page.locator('img[alt^="AI assistant workspace"]:visible')).toHaveAttribute(
    "src",
    /ai-assistant-workspace-dark/,
  );
});

test("AI assistant gallery card opens the renamed HonestUI workspace", async ({ page }) => {
  await page.goto("/docs/examples");
  await page.getByRole("link", { name: "Preview AI Assistant Workspace" }).click();

  await expect(page).toHaveURL(/\/examples\/ai-assistant-workspace$/);
  await expect(page.getByRole("heading", { name: "Good morning, Connor" })).toBeVisible();
  await expect(page.getByText("I’m Scout. What should we work on first?", { exact: true })).toBeVisible();
  await expect(page.getByText("Recent conversations (48)", { exact: true })).toBeVisible();
  await expect(page.getByText("Suggested applications", { exact: true })).toBeVisible();
});

test("AI assistant workspace uses revised content and an operable sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 750 });
  await page.goto("/examples/ai-assistant-workspace");

  await expect(page.getByText("Morrow", { exact: true })).toBeVisible();
  await expect(page.getByText("Connor Love", { exact: true })).toBeVisible();
  await expect(page.getByText("Ask Scout", { exact: true })).toBeVisible();
  await expect(page.getByText("Harborview", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "New session" })).toBeVisible();
  await expect(page.getByLabel("Suggested prompts").getByRole("button")).toHaveCount(3);
  await expect(page.getByText("Jane Moore", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Rune", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Acme Corp", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Activity", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Notes", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Automations", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Tasks", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Templates", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Context" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Preferences" })).toHaveCount(0);

  const workspaceSwitcher = page.getByRole("button", { name: "Morrow" });
  const restingBackground = await workspaceSwitcher.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(restingBackground).toBe("rgba(0, 0, 0, 0)");
  await workspaceSwitcher.hover();
  await expect
    .poll(() =>
      workspaceSwitcher.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .not.toBe(restingBackground);

  await page
    .getByRole("heading", { name: "Suggested applications" })
    .scrollIntoViewIfNeeded();
  await expect(page.getByText("Stripe MCP", { exact: true })).toBeVisible();
  await expect(page.getByText("Google Calendar", { exact: true })).toBeVisible();
  await expect(page.getByText("Notion", { exact: true })).toBeVisible();
  await expect(page.getByText("Dropbox", { exact: true })).toBeVisible();
  await expect(page.locator("[data-application-logo]")).toHaveCount(4);
  await expect(page.getByText("Suggested tools", { exact: true })).toHaveCount(0);

  const navigation = page.getByRole("complementary", { name: "Workspace navigation" });
  await expect(navigation).toHaveCSS("width", "208px");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(navigation).toHaveCSS("width", "68px");

  const exampleFont = await page.locator('[data-example="ai-assistant-workspace"]').evaluate(
    (element) => getComputedStyle(element).fontFamily,
  );
  expect(exampleFont).toContain("loveSans");
});

test("AI assistant workspace keeps mobile navigation and theme controls operable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/examples/ai-assistant-workspace");

  const navigation = page.getByRole("complementary", { name: "Workspace navigation" });
  await expect(navigation).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(navigation).toBeVisible();
  await page.getByRole("button", { name: "Close navigation" }).click();
  await expect(navigation).toBeHidden();

  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", initialTheme ?? "");
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
  for (const theme of ["light", "dark"] as const) {
    for (const path of [
      "/docs/examples",
      "/examples/crm-customer-list",
      "/examples/ai-assistant-workspace",
    ]) {
      await page.goto(path);
      await page.evaluate(
        (activeTheme) => localStorage.setItem("theme", activeTheme),
        theme,
      );
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
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

      expect(results.violations, `${path} (${theme})`).toEqual([]);
    }
  }
});
