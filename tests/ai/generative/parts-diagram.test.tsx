// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { GeneratedPartsDiagram } from "@/registry/honest-ai/generative/renderers/parts-diagram";
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
  await React.act(async () => root.render(<GeneratedPartsDiagram props={props} />));
  return container;
}

const part = (label: string, value?: string, detail?: string, size?: number) => ({
  props: { label, value, detail, size },
});

it("lays a row out as one bar, sized by each part, with every label under its segment", async () => {
  const container = await render({
    arrangement: "row",
    parts: [part("Scheme", "https://", "How to connect"), part("Host", "example.com", "Which server", 2)],
    caption: "Read it left to right.",
  });
  const list = container.querySelector("ol")!;
  expect(list.dataset.layout).toBe("bar");
  expect(list.style.getPropertyValue("--parts-columns")).toBe("minmax(0, 1fr) minmax(0, 2fr)");
  const items = [...list.children].map((item) => item.textContent);
  expect(items).toEqual(["https://SchemeHow to connect", "example.comHostWhich server"]);
  expect(container.querySelector("figcaption")?.textContent).toBe("Read it left to right.");
});

it("shows every part of a long row, as lines rather than a cramped bar", async () => {
  const fields = Array.from({ length: 10 }, (_, i) => part(`Field ${i + 1}`, String(i)));
  const container = await render({ arrangement: "row", parts: fields });
  const list = container.querySelector("ol")!;
  expect(list.children).toHaveLength(10);
  expect(list.dataset.layout).toBe("lines");
});

it("stacks layers top first", async () => {
  const container = await render({
    arrangement: "stack",
    parts: [part("Application", "HTTP"), part("Transport", "TCP"), part("Internet", "IP")],
  });
  expect([...container.querySelectorAll("ol > li")].map((item) => item.textContent)).toEqual([
    "ApplicationHTTP",
    "TransportTCP",
    "InternetIP",
  ]);
});

it("nests each part inside the one before, as nested lists named for their container", async () => {
  const container = await render({
    arrangement: "nested",
    parts: [part("Margin"), part("Border"), part("Padding"), part("Content", "200 × 100")],
  });
  const inner = [...container.querySelectorAll("ul[aria-label]")].map((list) =>
    list.getAttribute("aria-label"),
  );
  expect(inner).toEqual(["Inside Margin", "Inside Border", "Inside Padding"]);
  // The innermost part holds the value, and nothing holds it.
  const innermost = container.querySelector("ul[aria-label='Inside Padding'] > li")!;
  expect(innermost.textContent).toBe("Content200 × 100");
  expect(innermost.querySelector("ul")).toBeNull();
});

it("shows the parts that have arrived while a reply streams", async () => {
  const container = await render({ arrangement: "stack", parts: [part("Application"), null, part("Internet")] });
  expect(container.querySelectorAll("ol > li")).toHaveLength(1);
  expect((await render({ arrangement: "row", parts: [] })).innerHTML).toBe("");
});
