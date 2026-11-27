import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function playground(page: import("@playwright/test").Page) {
  await page.goto("/docs/ai/generative");
  const preview = page.locator('[data-slot="generative-playground"]');
  await page
    .locator('[data-component-preview="generative-ui-demo"]')
    .scrollIntoViewIfNeeded();
  await expect(preview).toBeVisible();
  return preview;
}
test("generated form validates, keeps input and emits real form state", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Form", exact: true }).click();
  await preview.getByRole("button", { name: "Send", exact: true }).click();
  await expect(preview.getByRole("alert")).toBeVisible();
  await preview
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("connor@example.test");
  await preview.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    preview.getByText(
      "Action received locally. Nothing was submitted to a server.",
    ),
  ).toBeVisible();
  await expect(preview.locator("pre")).toContainText("connor@example.test");
  await expect(
    preview.getByRole("textbox", { name: "Email", exact: true }),
  ).toHaveValue("connor@example.test");
  const axe = await new AxeBuilder({ page })
    .include('[data-slot="generative-playground"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});
test("stream replay disables actions and restores them on stop", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Form", exact: true }).click();
  await preview.getByRole("button", { name: "Replay stream" }).click();
  await expect(
    preview.getByRole("button", { name: "Replay stream" }),
  ).toBeDisabled();
  await preview.getByRole("button", { name: "Stop replay" }).click();
  await expect(
    preview.getByRole("textbox", { name: "Email", exact: true }),
  ).toBeEnabled();
});
test("generated tabs support the keyboard and malformed output shows diagnostics", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Tabs", exact: true }).click();
  await preview.getByRole("tab", { name: "Summary" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(preview.getByRole("tab", { name: "Details" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(preview.getByRole("tab", { name: "Details" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await preview
    .getByRole("textbox", { name: "Honest AI Lang source" })
    .fill('root = Stack([MissingComponent("test")])');
  await expect(preview.getByRole("alert")).toContainText(/MissingComponent/);
});
test("local chat sends through the headless adapter and keeps thread history", async ({
  page,
}) => {
  await page.goto("/docs/ai/generative/chat");
  await page
    .locator('[data-component-preview="generative-chat-demo"]')
    .scrollIntoViewIfNeeded();
  const preview = page.locator('[data-slot="generative-chat-demo"]');
  await expect(preview).toBeVisible();
  await preview
    .getByRole("textbox", { name: "Prompt", exact: true })
    .fill("Show my checklist");
  await preview.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    preview.getByText("You sent: Show my checklist", { exact: true }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "New conversation" }).click();
  await expect(preview.getByText("Send a message to start.")).toBeVisible();
  const history = preview.getByRole("combobox", {
    name: "Conversation history",
  });
  await history.click();
  await page.getByRole("option", { name: "Show my checklist", exact: true }).click();
  await expect(
    preview.getByText("You sent: Show my checklist", { exact: true }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include('[data-slot="generative-chat-demo"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});
test("reply features demo shows a table, a visual and an editable artifact", async ({
  page,
}) => {
  await page.goto("/docs/ai/generative/replies");
  await page
    .locator('[data-component-preview="generative-reply-demo"]')
    .scrollIntoViewIfNeeded();
  const preview = page.locator('[data-slot="generative-reply-demo"]');
  const prompt = preview.getByRole("textbox", { name: "Prompt", exact: true });
  const send = async (text: string) => {
    await prompt.fill(text);
    await preview.getByRole("button", { name: "Send", exact: true }).click();
  };
  await send("table");
  await expect(preview.getByText("Planets and dwarf planets").first()).toBeVisible();
  await preview.getByRole("searchbox").fill("dwarf");
  await expect(preview.getByRole("status").filter({ hasText: /2 of 10 rows/ })).toBeVisible();
  await send("visual");
  await expect(preview.locator('iframe[title="TCP three-way handshake"]')).toBeVisible();
  await send("artifact");
  await preview.getByRole("button", { name: /Onboarding plan/ }).click();
  await page.getByRole("button", { name: "Edit Onboarding plan" }).click();
  await expect(page.getByRole("textbox", { name: /Onboarding plan/ })).toHaveValue(/## Week 1: Setup/);
});
test("gallery renders every sample without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/docs/ai/generative/gallery");
  const previews = page.locator('[data-component-preview^="gallery-"]');
  const count = await previews.count();
  expect(count).toBeGreaterThan(20);
  for (let index = 0; index < count; index++) {
    const preview = previews.nth(index);
    await preview.scrollIntoViewIfNeeded();
    await expect(preview.locator('[data-slot="generative-sample"]')).toBeVisible();
  }
  const buttons = page.locator('[data-component-preview="gallery-buttons"]');
  await buttons.getByRole("button", { name: "Explain it simply" }).click();
  await expect(buttons.getByRole("status")).toHaveText(
    "In a chat, this sends “Explain it simply” to the assistant.",
  );
  expect(errors).toEqual([]);
});
test("a visual's canvas drawing that runs past its edges zooms out to stay in frame", async ({ page }) => {
  const { canvasFit } = await import("../../../registry/honest-ai/generative/renderers/canvas-fit");
  await page.setContent("<canvas id=c width=200 height=100></canvas>");
  await page.addScriptTag({ content: `(function(){var __name=function(t){return t};(${canvasFit.toString()})();})();` });
  const drawn = await page.evaluate(() => {
    const canvas = document.getElementById("c") as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    // A trail that runs four times past the right edge, with no clear between dots.
    for (let x = 0; x <= 800; x += 10) context.fillRect(x, 50, 4, 4);
    const pixels = context.getImageData(0, 0, 200, 100).data;
    let right = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 0) right = Math.max(right, (i / 4) % 200);
    return { right, transform: context.getTransform().isIdentity };
  });
  // The last dot is drawn inside the canvas, and the visual still sees its own transform.
  expect(drawn.right).toBeGreaterThan(150);
  expect(drawn.right).toBeLessThan(200);
  expect(drawn.transform).toBe(true);
});
test("a checklist in a reply can be ticked by its box or its text", async ({ page }) => {
  await page.goto("/docs/ai/generative/gallery");
  const preview = page.locator('[data-component-preview="gallery-lists"]');
  await preview.scrollIntoViewIfNeeded();
  const tests = preview.getByRole("checkbox", { name: "Run the tests" });
  await expect(tests).not.toBeChecked();
  await preview.getByText("Run the tests").click();
  await expect(tests).toBeChecked();
  await expect(preview.locator("li[data-done]")).toHaveCount(2);
  const release = preview.getByRole("checkbox", { name: "Tag the release" });
  await release.press("Space");
  await expect(release).not.toBeChecked();
});
test("registry bundles contain portable source and their dependencies", async ({
  request,
}) => {
  for (const name of [
    "generative-ui",
    "generative-chat",
    "generative-server",
  ]) {
    const response = await request.get(`/r/ai/${name}.json`);
    expect(response.ok()).toBeTruthy();
    const item = await response.json();
    expect(item.files.length).toBeGreaterThan(5);
    expect(
      item.files.some((file: { path: string }) =>
        file.path.endsWith("LICENSE"),
      ),
    ).toBeTruthy();
    for (const file of item.files) {
      expect(file.target).toMatch(/^lib\/generative\//);
      expect(file.path).not.toMatch(/\.test\.|__tests__/);
      expect(file.content).not.toMatch(/https?:\/\/api\.thesys\.dev/);
      expect(file.content).not.toMatch(/from ["']@\/registry\//);
      expect(file.content).not.toMatch(/from ["']@\/components\/product\//);
    }
    expect(item.registryDependencies.length).toBeGreaterThan(0);
  }
});
test("editing a generated table changes only the selected row", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview
    .getByRole("textbox", { name: "Honest AI Lang source" })
    .fill(
      'root = Stack([table])\ntable = EditableTable("contacts", [{type: "text", key: "name", header: "Name"}], [{id: "one", values: ["First"]}, {id: "two", values: ["Second"]}])',
    );
  await preview.getByRole("cell", { name: "First", exact: true }).dblclick();
  const editor = preview.getByRole("textbox", { name: "Name", exact: true });
  await editor.fill("Updated");
  await editor.press("Enter");
  await expect(
    preview.getByRole("cell", { name: "Updated", exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole("cell", { name: "Second", exact: true }),
  ).toBeVisible();
  await preview.getByRole("button", { name: "Save changes" }).click();
  await expect(preview.locator("pre")).toContainText("Updated");
  await expect(preview.locator("pre")).toContainText("Second");
});
test("generated charts render and narrow layouts remain operable", async ({
  page,
}) => {
  const preview = await playground(page);
  await preview.getByRole("button", { name: "Chart", exact: true }).click();
  await expect(
    // Without axis labels the chart has no caption, so it is named for its
    // series, never for the component.
    preview.getByRole("img", { name: "Orders", exact: true }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .include('[data-slot="generative-playground"]')
    .analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  await preview.getByRole("button", { name: "Form", exact: true }).click();
  await expect(
    preview.getByRole("textbox", { name: "Email", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("chart styles preserve documentation spacing and table padding", async ({
  page,
}) => {
  for (const url of ["/docs/ai", "/docs/ai/generative/library"]) {
    await page.goto(url);
    const styles = await page.evaluate(() => ({
      cellPadding: parseFloat(
        getComputedStyle(document.querySelector("main th")!).paddingLeft,
      ),
      sectionSpacing: parseFloat(
        getComputedStyle(document.querySelector("main h2")!).marginTop,
      ),
    }));
    expect(styles.cellPadding).toBeGreaterThan(0);
    expect(styles.sectionSpacing).toBeGreaterThan(0);
  }
});

test("generative examples save and restore local state", async ({ page }) => {
  await page.goto("/docs/ai/generative/examples");
  const demo = page.locator('[data-slot="generative-state-demo"]');
  await page.locator('[data-component-preview="generative-state-demo"]').scrollIntoViewIfNeeded();
  await demo.getByRole("button", { name: "Add one", exact: true }).click();
  await expect(demo.getByText("Example packing count: 2", { exact: true })).toBeVisible();
  await demo.getByRole("button", { name: "Save snapshot" }).click();
  await demo.getByRole("button", { name: "Add one", exact: true }).click();
  await expect(demo.getByText("Example packing count: 3", { exact: true })).toBeVisible();
  await demo.getByRole("button", { name: "Restore snapshot" }).click();
  await expect(demo.getByText("Example packing count: 2", { exact: true })).toBeVisible();
});

test("generative query demo recovers without replacing its program", async ({ page }) => {
  await page.goto("/docs/ai/generative/tools");
  await page.locator('[data-component-preview="generative-query-demo"]').scrollIntoViewIfNeeded();
  const demo = page.locator('[data-slot="generative-query-demo"]');
  await expect(demo.getByText("Example orders", { exact: true })).toBeVisible();
  await expect(demo.getByRole("status")).toHaveCount(0);
  await page.clock.install({ time: new Date(0) });
  await page.clock.pauseAt(new Date(1000));
  await demo.getByRole("button", { name: "Simulate query failure" }).click();
  await page.clock.runFor(100);
  await expect(demo.getByRole("status").filter({ hasText: "Loading local example data" })).toBeVisible();
  await page.clock.runFor(500);
  await expect(demo.getByRole("alert")).toContainText("example data query failed");
  await demo.getByRole("button", { name: "Retry data query" }).click();
  await page.clock.runFor(500);
  await expect(demo.getByRole("alert")).toHaveCount(0);
  await expect(demo.getByText("Example orders", { exact: true })).toBeVisible();
});

test("generative examples render custom Honest UI components and explain invalid source", async ({ page }) => {
  await page.goto("/docs/ai/generative/examples");
  await page.locator('[data-component-preview="generative-custom-demo"]').scrollIntoViewIfNeeded();
  const custom = page.locator('[data-slot="generative-custom-demo"]');
  await expect(custom.getByText("Example shipment 1042")).toBeVisible();
  await expect(custom.locator('[data-slot="badge"]')).toHaveText("In transit");
  await page.locator('[data-component-preview="generative-diagnostics-demo"]').scrollIntoViewIfNeeded();
  const diagnostics = page.locator('[data-slot="generative-diagnostics-demo"]');
  await diagnostics.getByRole("button", { name: "Break component name" }).click();
  await expect(diagnostics.getByRole("alert")).toContainText("UnknownCard");
  await diagnostics.getByRole("button", { name: "Restore valid source" }).click();
  await expect(diagnostics.getByRole("alert")).toHaveCount(0);
  await expect(diagnostics.getByRole("status")).toContainText("passed local validation");
  const axe = await new AxeBuilder({ page }).include('[data-slot="generative-diagnostics-demo"]').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});

test("generated quiz radios support keyboard selection and submit alongside switches", async ({ page }) => {
  const preview = await playground(page);
  await preview.getByRole("textbox", { name: "Honest AI Lang source" }).fill(`root = Stack([quiz])
quiz = Form("quiz", buttons, [question, preferences])
question = FormControl("What is 2 + 2?", RadioGroup("answer", options, null, { required: true }))
options = [RadioItem("3", "", "three"), RadioItem("4", "", "four"), RadioItem("5", "", "five")]
preferences = FormControl("Feedback preferences", SwitchGroup("feedback", [SwitchItem("Explain mistakes", "Include an explanation", "explanations")]))
buttons = Buttons([Button("Check answers", @ToAssistant("Check my answers"), "primary")])`);
  const group = preview.getByRole("radiogroup", { name: "What is 2 + 2?" });
  await expect(group).toBeVisible();
  await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  await preview.getByRole("button", { name: "Check answers" }).click();
  await expect(preview.getByRole("alert")).toBeVisible();
  await group.getByRole("radio", { name: "3", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(group.getByRole("radio", { name: "4", exact: true })).toBeChecked();
  await preview.getByRole("switch", { name: /Explain mistakes/ }).click();
  await preview.getByRole("button", { name: "Check answers" }).click();
  await expect(preview.locator("pre")).toContainText('"formState"');
  const submitted = JSON.parse(await preview.locator("pre").textContent() ?? "{}");
  expect(submitted.formState.quiz).toEqual({
    answer: { value: "four" },
    feedback: { value: { explanations: true } },
  });
  await expect(group.getByRole("radio", { name: "4", exact: true })).toBeChecked();
  const axe = await new AxeBuilder({ page }).include('[data-slot="generative-playground"]').analyze();
  expect(axe.violations.map((item) => item.id)).toEqual([]);
});
