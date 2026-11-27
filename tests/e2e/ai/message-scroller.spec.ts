import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Message Scroller is in the component sidebar and its docs preview navigates messages", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/docs/ai");
  const link = page.getByRole("link", { name: /^Message Scroller/ }).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/docs\/ai\/message-scroller$/);
  await expect(page.getByRole("heading", { name: "Message Scroller", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Message Scroller/ }).first()).toHaveAttribute("aria-current", "page");

  const preview = page.locator('[data-component-preview="message-scroller-demo"]');
  await preview.scrollIntoViewIfNeeded();
  const viewport = preview.getByRole("region", { name: "Sample conversation" });
  const rail = preview.getByRole("navigation", { name: "Message navigation" });
  await expect(rail.getByRole("button")).toHaveCount(8);
  const first = rail.getByRole("button", { name: "Go to user message 1 of 8" });
  await first.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => viewport.evaluate(node => node.scrollTop)).toBeLessThan(56);
  await expect(viewport.getByText("What is a DNS resolver?", { exact: true })).toBeVisible();
  await rail.getByRole("button", { name: "Go to assistant message 8 of 8" }).click();
  await expect.poll(() => viewport.evaluate(node => node.scrollHeight - node.scrollTop - node.clientHeight)).toBeLessThan(2);

  const axe = await new AxeBuilder({ page }).include('[data-component-preview="message-scroller-demo"]').analyze();
  expect(axe.violations.map(item => item.id)).toEqual([]);

  const registry = await page.request.get("/r/ai/message-scroller.json");
  expect(registry.ok()).toBe(true);
  const item = await registry.json();
  expect(item.files).toHaveLength(1);
  expect(item.dependencies).toEqual(expect.arrayContaining(["motion", "clsx", "tailwind-merge"]));
});
