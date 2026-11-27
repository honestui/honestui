// @vitest-environment jsdom
import * as React from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";

(
  globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

it.each([
  ["gemini-3.8-flash", "stop"],
  ["gpt-6-luna", "stop"],
  ["gpt-6-luna", "length"],
])("the hosted playground sends %s and handles finish_reason=%s", async (model, finishReason) => {
  const chunk = (delta: object, finish: string | null = null) =>
    `data: ${JSON.stringify({ choices: [{ delta, finish_reason: finish }] })}\n\n`;
  let finishReply!: (response: Response) => void;
  const server = vi.fn<typeof fetch>(() =>
    new Promise<Response>((resolve) => {
      finishReply = resolve;
    }),
  );
  const reply = new Response(
    chunk({ role: "assistant", content: "## Hosted reply" }) +
      chunk({}, finishReason) +
      "data: [DONE]\n\n",
    { headers: { "Content-Type": "text/event-stream" } },
  );
  // The transport keeps the fetch it finds when the module loads.
  vi.stubGlobal("fetch", server);
  const { Playground } = await import(
    "@/components/docs/ai/playground/playground"
  );

  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await React.act(async () => {
    root.render(
      <Playground provider={{ kind: "hosted", model }} />,
    );
  });
  expect(container.textContent).toContain(model);
  expect(container.textContent).not.toMatch(/Ollama|local model/i);

  const input = container.querySelector(
    'textarea[aria-label="Prompt"]',
  ) as HTMLTextAreaElement;
  expect(input.disabled).toBe(false);
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(input, "Hello");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await React.act(async () => {
    input
      .closest("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });

  const [url, init] = server.mock.calls[0];
  expect(url).toBe("/api/playground/chat");
  expect(JSON.parse(init!.body as string).model).toBe(model);
  expect(JSON.parse(init!.body as string).messages).toEqual([
    { role: "user", content: "Hello" },
  ]);
  expect(container.querySelector('[data-slot="loading-state"]')).not.toBeNull();
  expect(container.querySelector('[role="status"]')?.textContent).toContain(
    `Waiting for ${model}`,
  );
  await React.act(async () => finishReply(reply));
  expect(container.querySelector('[data-slot="loading-state"]')).toBeNull();
  expect(container.querySelector(".honest-prose h2")?.textContent).toBe(
    "Hosted reply",
  );
  if (finishReason === "length") {
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("output limit");
    expect(input.value).toBe("Hello");
  }
  await React.act(async () => root.unmount());
  // The first run imports the whole playground cold, which can pass 5s on a busy machine.
}, 20_000);
