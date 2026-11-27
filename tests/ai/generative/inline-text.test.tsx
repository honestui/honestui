// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { InlineText } from "@/registry/honest-ai/generative/renderers/inline-text";
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  document.body.innerHTML = "";
});

async function render(value: string) {
  const container = document.createElement("p");
  document.body.append(container);
  await React.act(async () => createRoot(container).render(<InlineText value={value} />));
  return container;
}

it("renders the bold and italic a model writes in a formula", async () => {
  const text = await render(
    "compounded monthly: **balance = deposit × ((1 + r)^n − 1) ÷ r**, where *r* is the monthly rate and *n* the number of months.",
  );
  expect(text.querySelector("strong")?.textContent).toBe("balance = deposit × ((1 + r)^n − 1) ÷ r");
  expect([...text.querySelectorAll("em")].map((node) => node.textContent)).toEqual(["r", "n"]);
  expect(text.textContent).not.toContain("*");
});

it.each([
  "int **pp points to a pointer",
  "*p = 20; *q = 30;",
  "area = a * b * c",
  "2*3*4",
  "a lone * star",
  "**unclosed bold",
])("leaves %j as typed", async (value) => {
  const text = await render(value);
  expect(text.textContent).toBe(value);
  expect(text.querySelector("strong, em")).toBeNull();
});

it("never reads emphasis inside code", async () => {
  const text = await render("Use `**kwargs` or **bold** text");
  expect(text.querySelector("code")?.textContent).toBe("**kwargs");
  expect(text.querySelector("strong")?.textContent).toBe("bold");
});
