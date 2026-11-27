// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { GeneratedDiagram } from "@/registry/honest-ai/generative/renderers/diagram";
(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  document.body.innerHTML = "";
});

async function render(props: Record<string, unknown>) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => root.render(<GeneratedDiagram props={props} />));
  return container;
}

const node = (title: string, value?: string) => ({ props: { title, value } });

it("shows only the nodes that have arrived while a reply streams", async () => {
  const container = await render({
    nodes: [node("Client"), node("Server"), null],
    arrows: ["sends a request to", "queries"],
  });
  expect(container.querySelectorAll("ol > li:not([aria-hidden])")).toHaveLength(2);
  // No arrow points past the last node that arrived.
  expect(container.querySelectorAll("ol > li[aria-hidden]")).toHaveLength(1);
  expect(container.textContent).not.toContain("queries");
});

it("names an unlabeled arrow for screen readers without drawing a label", async () => {
  const container = await render({ nodes: [node("Source"), node("Binary")] });
  expect(container.querySelector(".sr-only")?.textContent).toBe("Leads to Binary.");
  expect(container.querySelector("li[aria-hidden]")?.textContent).toBe("");
});

it("renders nothing before the first node arrives", async () => {
  const container = await render({ nodes: [] });
  expect(container.innerHTML).toBe("");
});

it("stacks chains longer than three boxes at every width", async () => {
  const container = await render({
    nodes: [node("pp"), node("p"), node("x"), node("value")],
  });
  expect(container.querySelector("ol")?.className).not.toMatch(/flex-row/);
});

it("renders code spans as code and leaves other Markdown as typed", async () => {
  const container = await render({
    nodes: [node("Pointer `p`"), node("int **pp")],
    arrows: ["points to"],
    caption: "Pointer `p` holds the address of variable `x`",
  });
  const caption = container.querySelector("figcaption")!;
  expect(caption.textContent).toBe("Pointer p holds the address of variable x");
  expect([...caption.querySelectorAll("code")].map((code) => code.textContent)).toEqual(["p", "x"]);
  expect(container.querySelector("strong")?.querySelector("code")?.textContent).toBe("p");
  expect(container.textContent).toContain("int **pp");
  expect(container.querySelector(".sr-only")?.textContent).toBe("points to int **pp.");
});
