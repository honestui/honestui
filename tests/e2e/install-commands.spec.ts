import { expect, test } from "@playwright/test";

test("offers shadcn commands for every registry-item install surface", async ({ page }) => {
  await page.goto("/docs/components/button");

  const installCommand = page.locator("[data-install-command]:visible").first();
  await expect(
    installCommand.getByText("npx honestui@latest add button", { exact: true }),
  ).toBeVisible();
  const shadcnTab = installCommand.getByRole("tab", { name: "shadcn", exact: true });
  await expect(shadcnTab).toBeVisible();
  await expect(shadcnTab.locator("svg[aria-hidden='true']")).toBeVisible();
  await shadcnTab.click();
  await expect(shadcnTab).toHaveAttribute("aria-selected", "true");
  await expect(
    installCommand.getByText("npx shadcn@latest add @honestui/button", { exact: true }),
  ).toBeVisible();

  await page.goto("/docs/animated/text-shimmer");
  await expect(
    page
      .locator("[data-install-command]:visible")
      .first()
      .getByText("npx shadcn@latest add @honestui/text-shimmer", { exact: true }),
  ).toBeVisible();

  await page.goto("/docs/get-started");
  await expect(
    page
      .locator("[data-install-command]:visible")
      .nth(1)
      .getByText(
        "npx shadcn@latest add @honestui/dialog @honestui/select @honestui/tabs",
        { exact: true },
      ),
  ).toBeVisible();
});
